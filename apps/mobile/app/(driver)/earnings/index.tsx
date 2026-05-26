import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius } from '@constants/theme';
import { EarningsBar } from '@components/ui/EarningsBar';
import { Skeleton } from '@components/ui/Skeleton';
import { getEarningsSummary } from '@services';
import { useAuthStore } from '@store/auth.store';
import type { EarningsSummary } from '@/types';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const user = useAuthStore((s) => s.user);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    getEarningsSummary(user?.id ?? '').then(setEarnings).catch(() => {
      // Show empty state on error
      setEarnings(null);
    });
  }, []);

  if (!earnings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.skeletons}>
          <Skeleton width="100%" height={120} borderRadius={12} />
          <Skeleton width="100%" height={200} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  const weekGrowth = earnings.totalEarned > earnings.previousWeekTotal;
  const growthPct = Math.round(
    ((earnings.totalEarned - earnings.previousWeekTotal) / earnings.previousWeekTotal) * 100,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.week}>{earnings.weekLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Total earned */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>THIS WEEK</Text>
          <Text style={styles.totalValue}>${earnings.totalEarned}</Text>
          <View style={[styles.growthBadge, { backgroundColor: weekGrowth ? C.status.green + '22' : C.status.red + '22' }]}>
            <Ionicons name={weekGrowth ? 'trending-up' : 'trending-down'} size={14} color={weekGrowth ? C.status.green : C.status.red} />
            <Text style={[styles.growthText, { color: weekGrowth ? C.status.green : C.status.red }]}>
              {Math.abs(growthPct)}% vs last week
            </Text>
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
            { label: 'Avg per job', value: `$${earnings.averagePerJob}` },
            { label: 'Best day', value: `${earnings.bestDay.day} $${earnings.bestDay.amount}` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.subCard}>
          <Text style={styles.subLabel}>Weekly subscription</Text>
          <Text style={styles.subValue}>-${earnings.subscriptionCost}</Text>
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
    content: { padding: Spacing.screenH, gap: Spacing.gap },
    totalCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.section, alignItems: 'center', gap: Spacing.gapSm },
    totalLabel: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    totalValue: { fontSize: Typography.sizes.largePrice, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    growthBadge: { borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
    growthText: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, fontVariant: ['tabular-nums'] },
    chartCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gap },
    chartTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.text.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.gap },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: 4 },
    statValue: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    statLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    subCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, flexDirection: 'row', justifyContent: 'space-between' },
    subLabel: { fontSize: Typography.sizes.body, color: C.text.secondary },
    subValue: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.secondary, fontVariant: ['tabular-nums'] },
  });
}
