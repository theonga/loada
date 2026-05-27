import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { MapBg } from '@components/ui/MapBg';
import { MapPin } from '@components/ui/MapPin';
import { Avatar } from '@components/ui/Avatar';
import { StatusBadge } from '@components/ui/StatusBadge';
import { getJobById, getDriverProfile, getJobDirections } from '@services';
import { useDriverLocation } from '@hooks/useDriverLocation';
import { JobStatus } from '@constants/index';
import type { Job, DriverProfile, RoutePoint } from '@/types';

export default function TrackingScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
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

  const driverPosition = useDriverLocation(jobId);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapBg
          initialRegion={job ? {
            latitude: (job.originLat + job.destLat) / 2,
            longitude: (job.originLng + job.destLng) / 2,
            latitudeDelta: Math.abs(job.destLat - job.originLat) + 0.05,
            longitudeDelta: Math.abs(job.destLng - job.originLng) + 0.05,
          } : undefined}
          routePoints={routePoints}
        >
          <View style={styles.pinMe}><MapPin kind="me" /></View>
          <View style={styles.pinDriver}><MapPin kind="driver" /></View>
          <View style={styles.pinDest}><MapPin kind="dest" label="Dest" /></View>
        </MapBg>
      </View>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
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
              <Text style={styles.statValue}>
                {driverPosition?.etaSeconds
                  ? `${Math.round(driverPosition.etaSeconds / 60)}m`
                  : '—'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Speed</Text>
              <Text style={styles.statValue}>
                {driverPosition?.speed != null
                  ? `${Math.round(driverPosition.speed)} km/h`
                  : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <Text style={styles.routeText} numberOfLines={1}>
              {job?.originAddress.split(',')[0] ?? '—'}
            </Text>
            <View style={styles.routeProgress}>
              <View style={styles.routeProgressFill} />
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
    mapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    pinMe: { position: 'absolute', top: '45%', left: '45%' },
    pinDriver: { position: 'absolute', top: '35%', left: '60%' },
    pinDest: { position: 'absolute', bottom: '25%', right: '20%' },
    overlay: { flex: 1 },
    backBtn: {
      position: 'absolute',
      top: 56,
      left: Spacing.screenH,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.background.card,
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
    chatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.background.elevated, borderWidth: 1, borderColor: C.background.divider, alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: C.background.elevated, borderRadius: Radius.inner, padding: 12 },
    stat: { alignItems: 'center', gap: 4 },
    statLabel: { fontSize: Typography.sizes.micro, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1 },
    statValue: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm },
    routeText: { flex: 1, fontSize: Typography.sizes.chip, color: C.text.secondary, textAlign: 'center' },
    routeProgress: { flex: 2, height: 3, backgroundColor: C.background.divider, borderRadius: 2 },
    routeProgressFill: { width: '45%', height: '100%', backgroundColor: C.accent, borderRadius: 2 },
  });
}
