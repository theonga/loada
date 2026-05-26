import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Chip } from '@components/ui/Chip';
import { MapBg } from '@components/ui/MapBg';
import { MapPin } from '@components/ui/MapPin';
import { Skeleton } from '@components/ui/Skeleton';
import { getJobById } from '@services';
import { TONNAGE_LABELS } from '@constants/index';
import type { Job } from '@/types';

export default function LoadDetailScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    if (!jobId) return;
    getJobById(jobId)
      .then((j) => { setJob(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: Spacing.screenH, gap: Spacing.gap }}>
          <Skeleton width="100%" height={160} borderRadius={12} />
          <Skeleton width="100%" height={80} borderRadius={12} />
          <Skeleton width="100%" height={80} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.text.secondary }}>Load not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Load detail</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Mini map */}
        <View style={styles.miniMap}>
          <MapBg
            initialRegion={{
              latitude: (job.originLat + job.destLat) / 2,
              longitude: (job.originLng + job.destLng) / 2,
              latitudeDelta: Math.abs(job.destLat - job.originLat) + 0.05,
              longitudeDelta: Math.abs(job.destLng - job.originLng) + 0.05,
            }}
          >
            <View style={styles.originPin}><MapPin kind="origin" /></View>
            <View style={styles.destPin}><MapPin kind="dest" /></View>
          </MapBg>
        </View>

        {/* Route */}
        <View style={styles.routeCard}>
          <Text style={styles.routeFrom}>{job.originAddress}</Text>
          <Ionicons name="arrow-down" size={16} color={C.text.tertiary} style={styles.routeArrow} />
          <Text style={styles.routeTo}>{job.destAddress}</Text>
          <View style={styles.routeStats}>
            <Text style={styles.routeStat}>{job.distanceKm} km</Text>
            <Text style={styles.routeStat}>·</Text>
            <Text style={styles.routeStat}>{job.estimatedHours}h drive</Text>
          </View>
        </View>

        {/* Cargo */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cargo</Text>
          <Text style={styles.cargoDesc}>{job.cargoDescription}</Text>
          <View style={styles.chips}>
            <Chip variant="amber">{TONNAGE_LABELS[job.requiredTonnes]}</Chip>
            {job.specialRequirements.map((r) => (
              <Chip key={r} variant={r === 'REFRIGERATED' ? 'blue' : 'default'}>{r}</Chip>
            ))}
          </View>
        </View>

        {/* Asking price */}
        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>Asking price</Text>
            <Text style={styles.priceValue}>${job.askingPrice}</Text>
          </View>
          <View>
            <Text style={styles.bidCountLabel}>{job.bidCount} bids</Text>
            <Text style={styles.bidCountSub}>so far</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.btn}
          onPress={() => router.push(`/(driver)/bid/${job.id}`)}
        >
          <Text style={styles.btnText}>Place a bid</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    scroll: { flex: 1 },
    scrollContent: { gap: Spacing.gap, padding: Spacing.screenH },
    miniMap: { height: 160, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: C.background.divider },
    originPin: { position: 'absolute', top: '25%', left: '20%' },
    destPin: { position: 'absolute', bottom: '25%', right: '20%' },
    routeCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: 4 },
    routeFrom: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    routeArrow: { paddingLeft: 4 },
    routeTo: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.accent },
    routeStats: { flexDirection: 'row', gap: 8, marginTop: 4 },
    routeStat: { fontSize: Typography.sizes.chip, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    card: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gapSm },
    cardTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.text.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    cargoDesc: { fontSize: Typography.sizes.body, color: C.text.primary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    priceCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { fontSize: Typography.sizes.label, color: C.text.secondary },
    priceValue: { fontSize: Typography.sizes.price, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'] },
    bidCountLabel: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'], textAlign: 'right' },
    bidCountSub: { fontSize: Typography.sizes.chip, color: C.text.secondary, textAlign: 'right' },
    footer: { padding: Spacing.screenH },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
