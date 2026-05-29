import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Skeleton } from '@components/ui/Skeleton';
import { ScreenError } from '@components/ui/ScreenError';
import { getJobById, updateJobStatus, getJobBids } from '@services';
import { isAuthError } from '@services/api';
import { useJobStore } from '@store/job.store';
import type { Job } from '@/types';

export default function DriverMatchConfirmedScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const setActiveJob = useJobStore((s) => s.setActiveJob);
  const flash = useRef(new Animated.Value(0.8)).current;
  const [job, setJob] = useState<Job | null>(null);
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const load = () => {
    if (!jobId) return;
    setLoading(true);
    setError('');
    Promise.all([getJobById(jobId), getJobBids(jobId)])
      .then(([j, bids]) => {
        setJob(j);
        setActiveJob(j);
        const accepted = bids.find((b) => b.status === 'ACCEPTED');
        setAgreedPrice(accepted?.offeredPrice ?? j.askingPrice);
        setLoading(false);
      })
      .catch((err) => { if (!isAuthError(err)) setError((err as Error).message ?? 'Failed to load job'); setLoading(false); });
  };

  async function handleNavigateToPickup() {
    if (!job) return;
    setNavigating(true);
    try {
      const updated = await updateJobStatus(job.id, 'PICKUP_EN_ROUTE');
      setActiveJob(updated);
      router.replace('/(driver)/active/en-route');
    } catch {
      setNavigating(false);
    }
  }

  useEffect(() => {
    Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { load(); }, [jobId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ padding: Spacing.screenH, gap: Spacing.gap }}>
          <Skeleton width="100%" height={240} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenError message={error} onRetry={load} onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View
        style={[styles.flashOverlay, { opacity: flash }]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Ionicons name="flash" size={14} color={C.accent} />
          <Text style={styles.badge}>MATCH CONFIRMED</Text>
        </View>
        <Text style={styles.heading}>You're on!</Text>

        <View style={styles.detailCard}>
          {job?.shipperName ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shipper</Text>
                <Text style={styles.detailValue}>{job.shipperName}</Text>
              </View>
              <View style={styles.divider} />
            </>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue}>{job?.originAddress ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination</Text>
            <Text style={styles.detailValue}>{job?.destAddress ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agreed price</Text>
            <Text style={styles.priceValue}>${agreedPrice ?? job?.askingPrice ?? '—'}</Text>
          </View>
          {job?.distanceKm ? (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>{job.distanceKm} km</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, navigating && { opacity: 0.6 }]}
          onPress={handleNavigateToPickup}
          disabled={navigating}
        >
          <Text style={styles.btnText}>{navigating ? 'Starting…' : 'Navigate to pickup'}</Text>
        </Pressable>
        {job && (
          <Pressable
            style={styles.ghostBtn}
            onPress={() => router.push(`/(shared)/chat/${job.id}`)}
          >
            <Text style={styles.ghostBtnText}>Message shipper</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.accent, zIndex: 10 },
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap, alignItems: 'center' },
    badgeRow: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 4 },
    badge: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.accent, letterSpacing: 1 },
    heading: { fontSize: Typography.sizes.heading, fontWeight: Typography.weights.bold, color: C.text.primary },
    detailCard: { width: '100%', backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.card },
    divider: { height: 1, backgroundColor: C.background.divider },
    detailLabel: { fontSize: Typography.sizes.body, color: C.text.secondary },
    detailValue: { fontSize: Typography.sizes.body, color: C.text.primary, fontWeight: Typography.weights.medium, flex: 1, textAlign: 'right' },
    priceValue: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'] },
    spacer: { flex: 1 },
    btn: { width: '100%', height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    ghostBtn: { width: '100%', height: Components.buttonHeight, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, alignItems: 'center', justifyContent: 'center' },
    ghostBtnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
  });
}
