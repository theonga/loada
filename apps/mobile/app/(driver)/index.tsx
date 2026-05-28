import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, Switch } from 'react-native';
import type MapView from 'react-native-maps';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { MapBg } from '@components/ui/MapBg';
import { MapPin } from '@components/ui/MapPin';
import { useAuthStore } from '@store/auth.store';
import { useLocationStore } from '@store/location.store';
import { useJobStore } from '@store/job.store';
import { JobStatus } from '@constants/index';
import { useDriverHeartbeat } from '@hooks/useDriverHeartbeat';
import { useCurrentLocation } from '@hooks/useCurrentLocation';
import { getAvailableLoads } from '@services';

export default function DriverHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isOnline, setOnline, driverLocation } = useLocationStore();
  const activeJob = useJobStore((s) => s.activeJob);
  const firstName = user?.name.split(' ')[0] ?? 'Driver';
  const [loadsCount, setLoadsCount] = useState<number | null>(null);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useDriverHeartbeat();

  const mapRef = useRef<MapView>(null);
  const { location: currentLocation } = useCurrentLocation();

  useEffect(() => {
    if (!isOnline) { setLoadsCount(null); return; }
    getAvailableLoads(user?.id ?? '')
      .then((jobs) => setLoadsCount(jobs.length))
      .catch(() => setLoadsCount(null));
  }, [isOnline]);

  // Animate to GPS position on first load if the heartbeat hasn't populated driverLocation yet
  useEffect(() => {
    if (!currentLocation || driverLocation) return;
    mapRef.current?.animateToRegion(
      { latitude: currentLocation.lat, longitude: currentLocation.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      800,
    );
  }, [currentLocation, driverLocation]);

  // Follow the driver's position as it updates from the heartbeat
  useEffect(() => {
    if (!driverLocation) return;
    mapRef.current?.animateToRegion(
      { latitude: driverLocation.lat, longitude: driverLocation.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      600,
    );
  }, [driverLocation]);

  const showActiveJob =
    activeJob != null &&
    (activeJob.status === JobStatus.PICKUP_EN_ROUTE ||
      activeJob.status === JobStatus.IN_TRANSIT ||
      activeJob.status === JobStatus.MATCHED);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapBg mapRef={mapRef}>
          {isOnline && (
            <>
              <View style={styles.pinLoad1}><MapPin kind="load" label="10t" /></View>
              <View style={styles.pinLoad2}><MapPin kind="load" label="5t" /></View>
            </>
          )}
        </MapBg>
      </View>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.appbar}>
          <View>
            <Text style={styles.greet}>Good morning</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.onlineToggle}>
            <Text style={[styles.onlineLabel, { color: isOnline ? C.status.green : C.text.secondary }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={setOnline}
              trackColor={{ false: C.background.divider, true: C.status.green + '44' }}
              thumbColor={isOnline ? C.status.green : C.text.tertiary}
            />
          </View>
        </View>

        <View style={styles.spacer} />

        {showActiveJob && activeJob && (
          <Pressable
            style={styles.activeJobCard}
            onPress={() => router.push(`/(driver)/active/en-route`)}
          >
            <Text style={styles.activeJobLabel}>ACTIVE JOB</Text>
            <Text style={styles.activeJobRoute}>
              {activeJob.originAddress.split(',')[0]} → {activeJob.destAddress.split(',')[0]}
            </Text>
          </Pressable>
        )}

        <View style={styles.bottomCard}>
          <Pressable
            style={styles.loadsBtn}
            onPress={() => router.push('/(driver)/loads')}
          >
            <Text style={styles.loadsBtnText}>Browse loads near me</Text>
            <Text style={styles.loadsBtnCount}>
              {isOnline
                ? loadsCount === null
                  ? 'Loading…'
                  : loadsCount === 0
                    ? 'No loads near you right now'
                    : `${loadsCount} load${loadsCount === 1 ? '' : 's'} available`
                : 'Go online to see loads'}
            </Text>
          </Pressable>
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
    pinLoad1: { position: 'absolute', top: '30%', left: '60%' },
    pinLoad2: { position: 'absolute', top: '55%', left: '25%' },
    overlay: { flex: 1 },
    appbar: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.screenH, paddingVertical: 12,
      backgroundColor: 'rgba(10,10,10,0.75)',
    },
    greet: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    name: { fontSize: 16, fontWeight: Typography.weights.semibold, color: C.text.primary },
    onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    onlineLabel: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.medium },
    spacer: { flex: 1 },
    activeJobCard: {
      marginHorizontal: Spacing.screenH, marginBottom: Spacing.gap,
      backgroundColor: 'rgba(20,20,20,0.92)', borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.accent,
      padding: Spacing.card,
    },
    activeJobLabel: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.accent, letterSpacing: 1 },
    activeJobRoute: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary, marginTop: 4 },
    bottomCard: {
      marginHorizontal: Spacing.screenH, marginBottom: Spacing.gap,
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider, overflow: 'hidden',
    },
    loadsBtn: { padding: Spacing.card, minHeight: Components.touchMin, justifyContent: 'center' },
    loadsBtnText: { fontSize: 16, fontWeight: Typography.weights.semibold, color: C.text.primary },
    loadsBtnCount: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2 },
  });
}
