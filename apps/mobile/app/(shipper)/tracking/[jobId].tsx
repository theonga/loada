import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { DARK_MAP_STYLE } from '@components/ui/MapBg';
import { Avatar } from '@components/ui/Avatar';
import { StatusBadge } from '@components/ui/StatusBadge';
import { getJobById, getDriverProfile, getJobDirections } from '@services';
import { useDriverLocation, type DriverPosition } from '@hooks/useDriverLocation';
import { JobStatus } from '@constants/index';
import type { Job, DriverProfile, RoutePoint } from '@/types';

export default function TrackingScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const mapRef = useRef<MapView | null>(null);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    if (!jobId) return;
    getJobById(jobId)
      .then((j) => {
        setJob(j);
        const tasks: Promise<unknown>[] = [];
        if (j.matchedDriverId) {
          tasks.push(getDriverProfile(j.matchedDriverId).then(setDriver));
        }
        tasks.push(
          getJobDirections(jobId)
            .then(setRoutePoints)
            .catch(() => {}),
        );
        return Promise.all(tasks);
      })
      .catch(() => {});
  }, [jobId]);

  const livePosition = useDriverLocation(jobId);

  // Fall back to the driver's last known DB location until a live socket update arrives,
  // so the map can zoom in on the driver immediately after matching.
  const driverPosition: DriverPosition | null = livePosition
    ?? (driver?.lastLocationLat != null && driver?.lastLocationLng != null
      ? { lat: driver.lastLocationLat, lng: driver.lastLocationLng }
      : null);

  // Keep the map centred on the driver as they move
  useEffect(() => {
    if (!driverPosition || !mapRef.current) return;
    mapRef.current.animateCamera(
      { center: { latitude: driverPosition.lat, longitude: driverPosition.lng }, zoom: 14 },
      { duration: 600 },
    );
  }, [driverPosition?.lat, driverPosition?.lng]);

  const etaText = livePosition?.etaSeconds
    ? `${Math.round(livePosition.etaSeconds / 60)} min`
    : '—';
  const speedText = livePosition?.speed != null
    ? `${Math.round(livePosition.speed)} km/h`
    : '—';
  const statusText = livePosition ? 'Live' : driverPosition ? 'Last seen' : 'Waiting…';

  return (
    <View style={styles.container}>
      {/* Full-screen live map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={
          job
            ? {
                latitude: (job.originLat + job.destLat) / 2,
                longitude: (job.originLng + job.destLng) / 2,
                latitudeDelta: Math.abs(job.destLat - job.originLat) * 2 + 0.05,
                longitudeDelta: Math.abs(job.destLng - job.originLng) * 2 + 0.05,
              }
            : undefined
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        {/* Route polyline */}
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor={C.accent}
            strokeWidth={3}
          />
        )}

        {/* Pickup marker */}
        {job && (
          <Marker
            coordinate={{ latitude: job.originLat, longitude: job.originLng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.pickupDot} />
          </Marker>
        )}

        {/* Destination marker */}
        {job && (
          <Marker
            coordinate={{ latitude: job.destLat, longitude: job.destLng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={[styles.pickupDot, styles.destDot]} />
          </Marker>
        )}

        {/* Live driver marker — heading rotation gives direction */}
        {driverPosition && (
          <Marker
            coordinate={{ latitude: driverPosition.lat, longitude: driverPosition.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={driverPosition.heading ?? 0}
            flat
            tracksViewChanges={false}
          >
            <View style={styles.driverMarkerOuter}>
              <View style={styles.driverMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        {/* Back button */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.text.primary} />
        </Pressable>

        <View style={styles.spacer} />

        {/* Tracking sheet */}
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.driverRow}>
            <Avatar name={driver?.name ?? '?'} size={44} />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver?.name ?? '—'}</Text>
              {job && <StatusBadge status={job.status as JobStatus} />}
            </View>
            <Pressable
              style={styles.chatBtn}
              onPress={() => job && router.push(`/(shared)/chat/${job.id}`)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={C.text.primary} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>ETA</Text>
              <Text style={styles.statValue}>{etaText}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>SPEED</Text>
              <Text style={styles.statValue}>{speedText}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>STATUS</Text>
              <Text style={styles.statValue}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <Text style={styles.routeText} numberOfLines={1}>
              {job?.originAddress.split(',')[0] ?? '—'}
            </Text>
            <View style={styles.routeProgress}>
              <View style={[styles.routeProgressFill, !driverPosition && { width: '0%' }]} />
            </View>
            <Text style={styles.routeText} numberOfLines={1}>
              {job?.destAddress.split(',')[0] ?? '—'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    overlay: { flex: 1 },

    backBtn: {
      position: 'absolute',
      top: 56,
      left: Spacing.screenH,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.background.card + 'EE',
      borderWidth: 1,
      borderColor: C.background.divider,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },

    spacer: { flex: 1 },

    sheet: {
      backgroundColor: C.background.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      gap: Spacing.gap,
    },
    handle: { width: 36, height: 4, backgroundColor: C.background.divider, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },

    driverRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gap },
    driverInfo: { flex: 1, gap: 4 },
    driverName: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    chatBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.background.elevated,
      borderWidth: 1, borderColor: C.background.divider,
      alignItems: 'center', justifyContent: 'center',
    },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: C.background.elevated,
      borderRadius: Radius.inner,
      padding: 12,
      alignItems: 'center',
    },
    stat: { flex: 1, alignItems: 'center', gap: 4 },
    statDivider: { width: 1, height: 28, backgroundColor: C.background.divider },
    statLabel: { fontSize: Typography.sizes.micro, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1 },
    statValue: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },

    routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm },
    routeText: { flex: 1, fontSize: Typography.sizes.chip, color: C.text.secondary, textAlign: 'center' },
    routeProgress: { flex: 2, height: 3, backgroundColor: C.background.divider, borderRadius: 2 },
    routeProgressFill: { width: '45%', height: '100%', backgroundColor: C.accent, borderRadius: 2 },

    // Map markers
    pickupDot: {
      width: 12, height: 12, borderRadius: 6,
      backgroundColor: '#fff',
      borderWidth: 2, borderColor: C.background.card,
    },
    destDot: { backgroundColor: C.accent },
    driverMarkerOuter: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: C.accent + '33',
      alignItems: 'center', justifyContent: 'center',
    },
    driverMarkerInner: {
      width: 12, height: 12, borderRadius: 6,
      backgroundColor: C.accent,
      borderWidth: 2, borderColor: '#fff',
    },
  });
}
