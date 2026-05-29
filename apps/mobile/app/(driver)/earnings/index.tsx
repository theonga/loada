import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius } from '@constants/theme';
import { EarningsBar } from '@components/ui/EarningsBar';
import { Skeleton } from '@components/ui/Skeleton';
import { getEarningsSummary } from '@services';
import { useAuthStore } from '@store/auth.store';
import { useWalletStore } from '@store/wallet.store';
import type { EarningsSummary } from '@/types';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const user = useAuthStore((s) => s.user);
  const { balance, setWallet, commissionPct } = useWalletStore();
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    getEarningsSummary(user?.id ?? '').then((e) => {
      setEarnings(e);
      if (e.walletBalance !== undefined) {
        setWallet(e.walletBalance, 0, commissionPct);
      }
    }).catch(() => {});
  }, []);

  if (!earnings) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={120} borderRadius={12} />
          <Skeleton width="100%" height={200} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  const hasPrevWeek = earnings.previousWeekTotal > 0;
  const weekGrowth = earnings.totalEarned >= earnings.previousWeekTotal;
  const growthPct = hasPrevWeek
    ? Math.round(((earnings.totalEarned - earnings.previousWeekTotal) / earnings.previousWeekTotal) * 100)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.week}>{earnings.weekLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Wallet balance card — always at the top */}
        <Pressable style={styles.walletCard} onPress={() => router.push('/(driver)/wallet')}>
          <View style={styles.walletLeft}>
            <Ionicons name="wallet-outline" size={18} color={C.accent} />
            <View>
              <Text style={styles.walletLabel}>Wallet balance</Text>
              <Text style={styles.walletBalance}>${balance.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.topUpBtn}>
            <Text style={styles.topUpText}>Top up</Text>
          </View>
        </Pressable>

        {/* Total gross earned */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>GROSS EARNINGS · THIS WEEK</Text>
          <Text style={styles.totalValue}>${earnings.totalEarned.toFixed(2)}</Text>
          {growthPct !== null ? (
            <View style={[styles.growthBadge, { backgroundColor: weekGrowth ? C.status.green + '22' : C.status.red + '22' }]}>
              <Ionicons name={weekGrowth ? 'trending-up' : 'trending-down'} size={14} color={weekGrowth ? C.status.green : C.status.red} />
              <Text style={[styles.growthText, { color: weekGrowth ? C.status.green : C.status.red }]}>
                {Math.abs(growthPct)}% vs last week
              </Text>
            </View>
          ) : (
            <View style={[styles.growthBadge, { backgroundColor: C.background.elevated }]}>
              <Text style={[styles.growthText, { color: C.text.tertiary }]}>First week</Text>
            </View>
          )}
        </View>

        {/* Commission + net row */}
        <View style={styles.feeSummary}>
          <View style={styles.feeItem}>
            <Text style={styles.feeLabel}>Loada fee ({commissionPct}%)</Text>
            <Text style={styles.feeValue}>-${earnings.totalCommissionPaid.toFixed(2)}</Text>
          </View>
          <View style={styles.feeDivider} />
          <View style={styles.feeItem}>
            <Text style={[styles.feeLabel, { color: C.text.primary }]}>Net to you</Text>
            <Text style={styles.netValue}>${earnings.netEarned.toFixed(2)}</Text>
          </View>
        </View>

        {/* Bar chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily breakdown</Text>
          <EarningsBar
            data={earnings.days.map((d) => ({ value: d.earned }))}
            average={earnings.averagePerJob}
            labels={earnings.days.map((d) => d.day)}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Jobs completed', value: String(earnings.jobsCompleted) },
            { label: 'Total km', value: `${earnings.totalKm} km` },
            { label: 'Avg per job', value: `$${earnings.averagePerJob.toFixed(2)}` },
            { label: 'Best day', value: `${earnings.bestDay.day} $${earnings.bestDay.amount.toFixed(2)}` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    skeletons: { padding: Spacing.screenH, gap: Spacing.gap },
    appbar: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 4 },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    week: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2 },
    content: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: Spacing.section },
    walletCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card,
    },
    walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    walletLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    walletBalance: {
      fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold,
      color: C.text.primary, fontVariant: ['tabular-nums'],
    },
    topUpBtn: {
      backgroundColor: 'rgba(245,166,35,0.12)', borderRadius: Radius.button,
      paddingHorizontal: 12, paddingVertical: 6,
    },
    topUpText: { fontSize: Typography.sizes.chip, fontWeight: Typography.weights.semibold, color: C.accent },
    totalCard: {
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider,
      padding: Spacing.section, alignItems: 'center', gap: Spacing.gapSm,
    },
    totalLabel: {
      fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold,
      color: C.text.secondary, letterSpacing: 1.2,
    },
    totalValue: {
      fontSize: Typography.sizes.largePrice, fontWeight: Typography.weights.bold,
      color: C.text.primary, fontVariant: ['tabular-nums'],
    },
    growthBadge: {
      borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 4,
      flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    growthText: {
      fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold,
      fontVariant: ['tabular-nums'],
    },
    feeSummary: {
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: 10,
    },
    feeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    feeDivider: { height: 1, backgroundColor: C.background.divider },
    feeLabel: { fontSize: Typography.sizes.label, color: C.text.secondary },
    feeValue: {
      fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold,
      color: C.text.secondary, fontVariant: ['tabular-nums'],
    },
    netValue: {
      fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold,
      color: C.status.green, fontVariant: ['tabular-nums'],
    },
    chartCard: {
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gap,
    },
    chartTitle: {
      fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold,
      color: C.text.secondary, textTransform: 'uppercase', letterSpacing: 1,
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.gap },
    statCard: {
      flex: 1, minWidth: '45%', backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: 4,
    },
    statValue: {
      fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold,
      color: C.text.primary, fontVariant: ['tabular-nums'],
    },
    statLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary },
  });
}
