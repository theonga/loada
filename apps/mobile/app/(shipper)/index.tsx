import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import type MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import { useJobStore } from '@store/job.store';
import { MapBg } from '@components/ui/MapBg';
import { MapPin } from '@components/ui/MapPin';
import { PulsingRadius } from '@components/ui/PulsingRadius';
import { JobStatus } from '@constants/index';
import { useCurrentLocation } from '@hooks/useCurrentLocation';
import { getNearbyDrivers } from '@services';
import type { DriverProfile } from '@/types';

export default function ShipperHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeJob = useJobStore((s) => s.activeJob);
  const firstName = user?.name.split(' ')[0] ?? 'there';
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const mapRef = useRef<MapView>(null);
  const { location } = useCurrentLocation();
  const [nearbyDrivers, setNearbyDrivers] = useState<DriverProfile[]>([]);

  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      800,
    );
    getNearbyDrivers(location.lat, location.lng).then(setNearbyDrivers).catch(() => {});
  }, [location]);

  const biddingExpired =
    activeJob != null &&
    (activeJob.status === JobStatus.EXPIRED ||
      ([JobStatus.POSTED, JobStatus.BIDDING, JobStatus.RADIUS_EXPANDED].includes(activeJob.status) &&
        activeJob.biddingExpiresAt != null &&
        new Date(activeJob.biddingExpiresAt) < new Date()));

  const showActiveJob =
    activeJob != null &&
    !biddingExpired &&
    [
      JobStatus.POSTED,
      JobStatus.BIDDING,
      JobStatus.RADIUS_EXPANDED,
      JobStatus.MATCHED,
      JobStatus.PICKUP_EN_ROUTE,
      JobStatus.PICKUP_ARRIVED,
      JobStatus.LOADED,
      JobStatus.IN_TRANSIT,
    ].includes(activeJob.status);

  // Markers inside MapView — geo-positioned driver pins
  const driverMarkers = nearbyDrivers
    .filter((d) => d.isOnline && d.lastLocationLat != null && d.lastLocationLng != null)
    .map((d) => (
      <Marker
        key={d.id}
        coordinate={{ latitude: d.lastLocationLat!, longitude: d.lastLocationLng! }}
        tracksViewChanges={false}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <MapPin kind="driver" scale={0.85} label={`${d.capacityTonnes}t`} />
      </Marker>
    ));

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapBg mapRef={mapRef} mapChildren={driverMarkers}>
          {/* Pulsing amber radius — always centered on user position */}
          <PulsingRadius color={C.accent} />
          {/* Static "me" pin centered on screen */}
          <View style={styles.mePin} pointerEvents="none">
            <MapPin kind="me" />
          </View>
        </MapBg>
      </View>

      <SafeAreaView style={styles.overlay} edges={['top']}>
        {/* Appbar */}
        <View style={styles.appbar}>
          <View>
            <Text style={styles.greet}>Good morning</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <Pressable
            style={styles.bellBtn}
            onPress={() => router.push('/(shared)/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={C.text.primary} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom card area — absolute so tab bar safe area doesn't double-count */}
      <View style={styles.bottomArea}>
        {nearbyDrivers.filter((d) => d.isOnline).length > 0 && (
          <View style={styles.driversNearby}>
            <Ionicons name="car-sport-outline" size={13} color={C.status.blue} />
            <Text style={styles.driversNearbyText}>
              {nearbyDrivers.filter((d) => d.isOnline).length} driver
              {nearbyDrivers.filter((d) => d.isOnline).length === 1 ? '' : 's'} near you
            </Text>
          </View>
        )}

        {showActiveJob && activeJob && (
          <Pressable
            style={styles.activeJobCard}
            onPress={() => {
              const biddingStatuses = [JobStatus.POSTED, JobStatus.BIDDING, JobStatus.RADIUS_EXPANDED];
              if (biddingStatuses.includes(activeJob.status)) {
                router.push(`/(shipper)/bids/${activeJob.id}`);
              } else {
                router.push(`/(shipper)/tracking/${activeJob.id}`);
              }
            }}
          >
            <View style={styles.activeJobLeft}>
              <View style={styles.activeDot} />
              <View style={styles.activeJobInfo}>
                <Text style={styles.activeJobRoute} numberOfLines={1}>
                  {activeJob.originAddress.split(',')[0]} → {activeJob.destAddress.split(',')[0]}
                </Text>
                <Text style={styles.activeJobStatus}>
                  {activeJob.status === JobStatus.POSTED || activeJob.status === JobStatus.BIDDING
                    ? 'Waiting for bids…'
                    : activeJob.status === JobStatus.RADIUS_EXPANDED
                      ? 'Expanding search…'
                      : activeJob.status === JobStatus.MATCHED
                        ? 'Driver matched'
                        : activeJob.status === JobStatus.PICKUP_EN_ROUTE
                          ? 'Driver en route'
                          : activeJob.status === JobStatus.IN_TRANSIT
                            ? 'In transit'
                            : activeJob.status}
                </Text>
              </View>
            </View>
            <View style={styles.activeJobArrow}>
              <Ionicons name="chevron-forward" size={16} color={C.accent} />
            </View>
          </Pressable>
        )}

        {/* Where to card */}
        <View style={styles.promptCard}>
          <Pressable
            style={styles.whereToRow}
            onPress={() => router.push('/(shipper)/post/route')}
          >
            <View style={styles.plusBtn}>
              <Ionicons name="add" size={22} color={C.background.primary} />
            </View>
            <View style={styles.whereToText}>
              <Text style={styles.whereTo}>Where to?</Text>
              <Text style={styles.whereToSub}>Post a load — drivers bid in minutes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.text.tertiary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    mapContainer: { position: 'absolute', inset: 0, flex: 1 } as never,
    mePin: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0 } as never,
    appbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.screenH,
      paddingVertical: 12,
      backgroundColor: 'rgba(10,10,10,0.7)',
    },
    greet: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    name: { fontSize: 16, fontWeight: Typography.weights.semibold, color: C.text.primary },
    bellBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.background.card,
      borderWidth: 1, borderColor: C.background.divider,
      alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    },
    bellDot: {
      position: 'absolute', top: 8, right: 9,
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.background.card,
    },
    bottomArea: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: Spacing.screenH,
      gap: Spacing.gap,
    } as never,
    driversNearby: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(33,150,243,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(33,150,243,0.25)',
      borderRadius: Radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    driversNearbyText: {
      fontSize: Typography.sizes.chip,
      color: C.status.blue,
      fontWeight: Typography.weights.medium,
      fontVariant: ['tabular-nums'],
    },
    activeJobCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: 'rgba(245,166,35,0.30)',
      paddingHorizontal: Spacing.card,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activeJobLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
    activeJobInfo: { flex: 1 },
    activeJobRoute: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    activeJobStatus: { fontSize: Typography.sizes.chip, color: C.accent, marginTop: 2 },
    activeJobArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(245,166,35,0.12)', alignItems: 'center', justifyContent: 'center' },
    promptCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      overflow: 'hidden',
    },
    whereToRow: {
      flexDirection: 'row', alignItems: 'center',
      padding: Spacing.card, gap: Spacing.gap,
      minHeight: Components.touchMin,
    },
    plusBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    whereToText: { flex: 1 },
    whereTo: { fontSize: 16, fontWeight: Typography.weights.semibold, color: C.text.primary },
    whereToSub: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2 },
  });
}
