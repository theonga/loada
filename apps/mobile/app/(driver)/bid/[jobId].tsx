import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { EarningsBar } from '@components/ui/EarningsBar';
import { Skeleton } from '@components/ui/Skeleton';
import { getJobById, placeBid, getEarningsSummary } from '@services';
import { useAuthStore } from '@store/auth.store';
import type { Job, EarningsSummary } from '@/types';

export default function PlaceBidScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const user = useAuthStore((s) => s.user);
  const [job, setJob] = useState<Job | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const numPrice = parseInt(price, 10) || 0;
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      getJobById(jobId),
      getEarningsSummary(user?.id ?? ''),
    ])
      .then(([j, e]) => {
        setJob(j);
        setEarnings(e);
        setPrice(String(Math.round(j.askingPrice * 0.96)));
        setLoading(false);
      })
      .catch(() => { setError('Could not load job details.'); setLoading(false); });
  }, [jobId]);

  const handleBid = async () => {
    if (!numPrice || !job) return;
    setSubmitting(true);
    setError('');
    try {
      const bid = await placeBid(job.id, numPrice);
      router.replace(`/(driver)/bid/pending/${bid.id}?jobId=${job.id}`);
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Could not place bid. Try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.appbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={C.text.primary} />
          </Pressable>
          <Text style={styles.title}>Place bid</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ padding: Spacing.screenH, gap: Spacing.gap }}>
          <Skeleton width="100%" height={80} borderRadius={12} />
          <Skeleton width="100%" height={160} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={{ color: C.text.secondary, textAlign: 'center', marginTop: 40 }}>
          {error || 'Job not found.'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Place bid</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.jobSummary}>
          <Text style={styles.route}>{job.originAddress.split(',')[0]} → {job.destAddress.split(',')[0]}</Text>
          <Text style={styles.distance}>{job.cargoDescription}</Text>
        </View>

        <View style={styles.priceInputArea}>
          <Text style={styles.priceLabel}>YOUR BID</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              autoFocus
            />
          </View>
          <Text style={styles.askingRef}>Asking price: ${job.askingPrice}</Text>
        </View>

        {earnings && earnings.days.length > 0 && (
          <View style={styles.earningsSection}>
            <Text style={styles.earningsTitle}>Your recent earnings</Text>
            <EarningsBar
              data={earnings.days.map((d) => ({ value: d.earned }))}
              average={earnings.averagePerJob}
              labels={earnings.days.map((d) => d.day)}
            />
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !numPrice && styles.btnDisabled]}
          onPress={handleBid}
          disabled={!numPrice || submitting}
        >
          <Text style={styles.btnText}>{submitting ? 'Placing bid…' : `Bid $${numPrice}`}</Text>
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
    scrollContent: { padding: Spacing.screenH, gap: Spacing.section },
    jobSummary: { gap: 4 },
    route: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    distance: { fontSize: Typography.sizes.label, color: C.text.secondary },
    priceInputArea: { gap: 8 },
    priceLabel: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    currency: { fontSize: Typography.sizes.heroPrice, fontWeight: Typography.weights.light, color: C.text.secondary },
    priceInput: {
      fontSize: Typography.sizes.heroPrice, fontWeight: Typography.weights.bold,
      color: C.text.primary, fontVariant: ['tabular-nums'], flex: 1, padding: 0,
    },
    askingRef: { fontSize: Typography.sizes.label, color: C.text.tertiary, fontVariant: ['tabular-nums'] },
    earningsSection: { gap: Spacing.gap },
    earningsTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.text.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    errorText: { color: C.status.red, fontSize: Typography.sizes.label, textAlign: 'center' },
    footer: { padding: Spacing.screenH },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
