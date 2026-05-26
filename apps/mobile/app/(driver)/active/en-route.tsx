import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { MapBg } from '@components/ui/MapBg';
import { MapPin } from '@components/ui/MapPin';
import { useJobStore } from '@store/job.store';
import { useLocationStore } from '@store/location.store';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function EnRouteScreen() {
  const router = useRouter();
  const job = useJobStore((s) => s.activeJob);
  const driverLoc = useLocationStore((s) => s.driverLocation);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const distanceKm =
    driverLoc && job
      ? haversineKm(driverLoc.lat, driverLoc.lng, job.originLat, job.originLng)
      : null;
  const etaMin = distanceKm != null ? Math.round((distanceKm / 50) * 60) : null;

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapBg
          initialRegion={driverLoc && job ? {
            latitude: (driverLoc.lat + job.originLat) / 2,
            longitude: (driverLoc.lng + job.originLng) / 2,
            latitudeDelta: Math.abs(driverLoc.lat - job.originLat) + 0.02,
            longitudeDelta: Math.abs(driverLoc.lng - job.originLng) + 0.02,
          } : undefined}
        >
          <View style={styles.pinDest}><MapPin kind="origin" label="Pickup" /></View>
        </MapBg>
      </View>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.appbar}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: C.status.amber }]} />
            <Text style={styles.statusText}>En route to pickup</Text>
          </View>
          <Pressable style={styles.chatBtn} onPress={() => job && router.push(`/(shared)/chat/${job.id}`)}>
            <Ionicons name="chatbubble-outline" size={22} color={C.text.primary} />
          </Pressable>
        </View>

        <View style={styles.spacer} />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.destination}>{job?.originAddress ?? '—'}</Text>
          <View style={styles.etaRow}>
            <View style={styles.etaItem}>
              <Text style={styles.etaValue}>
                {etaMin != null ? `${etaMin} min` : '—'}
              </Text>
              <Text style={styles.etaLabel}>ETA</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Text style={styles.etaValue}>
                {distanceKm != null ? `${distanceKm.toFixed(1)} km` : '—'}
              </Text>
              <Text style={styles.etaLabel}>Distance</Text>
            </View>
          </View>
          <Pressable
            style={styles.arrivedBtn}
            onPress={() => router.replace('/(driver)/active/pickup')}
          >
            <Text style={styles.arrivedBtnText}>I've arrived at pickup</Text>
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
    pinMe: { position: 'absolute', top: '55%', left: '45%' },
    pinDest: { position: 'absolute', top: '25%', left: '30%' },
    overlay: { flex: 1 },
    appbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screenH, paddingVertical: 12, backgroundColor: 'rgba(10,10,10,0.75)' },
    statusBadge: { backgroundColor: C.background.card, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.background.divider, flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.medium, color: C.text.primary },
    chatBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    spacer: { flex: 1 },
    sheet: { backgroundColor: C.background.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.card, gap: Spacing.gap },
    handle: { width: 36, height: 4, backgroundColor: C.background.divider, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
    destination: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    etaRow: { flexDirection: 'row', backgroundColor: C.background.elevated, borderRadius: Radius.inner, padding: 12 },
    etaItem: { flex: 1, alignItems: 'center' },
    etaDivider: { width: 1, backgroundColor: C.background.divider },
    etaValue: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    etaLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2 },
    arrivedBtn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    arrivedBtnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
