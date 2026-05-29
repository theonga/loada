import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, Switch } from 'react-native';
import type MapView from 'react-native-maps';
import { Marker } from 'react-native-maps';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { MapBg } from '@components/ui/MapBg';
import { MapPin } from '@components/ui/MapPin';
import { PulsingRadius } from '@components/ui/PulsingRadius';
import { useAuthStore } from '@store/auth.store';
import { useLocationStore } from '@store/location.store';
import { useJobStore } from '@store/job.store';
import { useWalletStore } from '@store/wallet.store';
import { JobStatus } from '@constants/index';
import { useCurrentLocation } from '@hooks/useCurrentLocation';
import { activeScreenForStatus } from '@hooks/useActiveJobRoute';
import { getAvailableLoads, getWalletBalance, setDriverOnline as setDriverOnlineApi, setDriverOffline as setDriverOfflineApi } from '@services';
import type { Job } from '@/types';

export default function DriverHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isOnline, setOnline, driverLocation } = useLocationStore();
  const activeJob = useJobStore((s) => s.activeJob);
  const { balance, setWallet, commissionPct } = useWalletStore();
  const firstName = user?.name.split(' ')[0] ?? 'Driver';
  const [nearbyLoads, setNearbyLoads] = useState<Job[]>([]);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const mapRef = useRef<MapView>(null);
  const { location: currentLocation } = useCurrentLocation();

  // Fetch wallet balance once on mount
  useEffect(() => {
    getWalletBalance()
      .then((w) => setWallet(w.balance, w.reservedBalance, w.commissionPct))
      .catch(() => {});
  }, []);

  // Fetch available loads whenever online state or location changes
  useEffect(() => {
    if (!isOnline) { setNearbyLoads([]); return; }
    getAvailableLoads(user?.id ?? '')
      .then(setNearbyLoads)
      .catch(() => setNearbyLoads([]));
  }, [isOnline, user?.id]);

  // Toggle online state — local store updates immediately for snappy UI, and
  // we tell the server in parallel so the admin dashboard / DB isOnline flag
  // reflects reality. GPS presence in Redis is still maintained by the heartbeat.
  const handleToggleOnline = async (next: boolean) => {
    setOnline(next);
    try {
      if (next) {
        const loc = currentLocation ?? driverLocation;
        if (!loc) return;
        await setDriverOnlineApi(loc.lat, loc.lng);
      } else {
        await setDriverOfflineApi();
      }
    } catch {
      // Server out of sync is non-fatal — the heartbeat reconciles. Don't
      // bounce the toggle on transient failures or the UI flickers.
    }
  };

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

  // Markers inside MapView — load origin pins (only when online)
  const loadMarkers = isOnline
    ? nearbyLoads.map((job) => (
        <Marker
          key={job.id}
          coordinate={{ latitude: job.originLat, longitude: job.originLng }}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
          onPress={() => router.push(`/(driver)/loads/${job.id}`)}
        >
          <MapPin kind="load" label={`${job.requiredTonnes}t`} />
        </Marker>
      ))
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapBg mapRef={mapRef} mapChildren={loadMarkers}>
          {/* Pulsing green radius when online, hidden when offline */}
          <PulsingRadius color={C.status.green} visible={isOnline} />
          {/* Static "me" pin centered on screen */}
          <View style={styles.mePin} pointerEvents="none">
            <MapPin kind="me" />
          </View>
        </MapBg>
      </View>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.appbar}>
          <View>
            <Text style={styles.greet}>Good morning</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <View style={styles.appbarRight}>
            <Pressable style={styles.balancePill} onPress={() => router.push('/(driver)/wallet')}>
              <Ionicons name="wallet-outline" size={13} color={C.accent} />
              <Text style={styles.balanceText}>${balance.toFixed(2)}</Text>
            </Pressable>
            <View style={styles.onlineToggle}>
              <Text style={[styles.onlineLabel, { color: isOnline ? C.status.green : C.text.secondary }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: C.background.divider, true: C.status.green + '44' }}
                thumbColor={isOnline ? C.status.green : C.text.tertiary}
              />
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        {isOnline && nearbyLoads.length > 0 && (
          <View style={styles.loadsBadge}>
            <Ionicons name="cube-outline" size={13} color={C.status.green} />
            <Text style={styles.loadsBadgeText}>
              {nearbyLoads.length} load{nearbyLoads.length === 1 ? '' : 's'} near you
            </Text>
          </View>
        )}

        {showActiveJob && activeJob && (
          <Pressable
            style={styles.activeJobCard}
            onPress={() => {
              // Route to whichever step matches the server-side job status, so
              // re-entering an in-progress job doesn't drop the driver back on
              // the "I've arrived at pickup" screen they already cleared.
              const target = activeScreenForStatus(activeJob.status) ?? '/(driver)/active/en-route';
              router.push(target as never);
            }}
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
                ? nearbyLoads.length === 0
                  ? 'No loads near you right now'
                  : `${nearbyLoads.length} load${nearbyLoads.length === 1 ? '' : 's'} available`
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
    mePin: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overlay: { flex: 1 },
    appbar: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.screenH, paddingVertical: 12,
      backgroundColor: 'rgba(10,10,10,0.75)',
    },
    greet: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    name: { fontSize: 16, fontWeight: Typography.weights.semibold, color: C.text.primary },
    appbarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    balancePill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(245,166,35,0.12)', borderRadius: Radius.pill,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: 'rgba(245,166,35,0.25)',
    },
    balanceText: {
      fontSize: Typography.sizes.chip, fontWeight: Typography.weights.semibold,
      color: C.accent, fontVariant: ['tabular-nums'],
    },
    onlineToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    onlineLabel: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.medium },
    spacer: { flex: 1 },
    loadsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      marginHorizontal: Spacing.screenH,
      marginBottom: Spacing.gap,
      backgroundColor: 'rgba(0,200,83,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(0,200,83,0.25)',
      borderRadius: Radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    loadsBadgeText: {
      fontSize: Typography.sizes.chip,
      color: C.status.green,
      fontWeight: Typography.weights.medium,
      fontVariant: ['tabular-nums'],
    },
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
