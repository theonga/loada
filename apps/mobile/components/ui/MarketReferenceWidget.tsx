import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useColors, ColorPalette, Radius, Spacing, Typography } from '@constants/theme';
import type { MarketReference } from '@/types';
import { Eyebrow } from './Eyebrow';

interface MarketReferenceWidgetProps {
  data: MarketReference;
  userPrice: number;
}

export function MarketReferenceWidget({ data, userPrice }: MarketReferenceWidgetProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const range = data.high - data.low;
  const lowPct = 0;
  const highPct = 100;
  const userPct = range > 0 ? Math.max(0, Math.min(100, ((userPrice - data.low) / range) * 100)) : 50;
  const medianPct = range > 0 ? ((data.median - data.low) / range) * 100 : 50;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Eyebrow>Market Reference</Eyebrow>
          <Text style={styles.route}>{data.route} · {data.tonnes}t</Text>
          <Text style={styles.period}>Based on {data.jobCount} jobs in last {data.periodDays}d</Text>
        </View>
        <Text style={styles.trendIcon}>↗</Text>
      </View>

      {/* Range track */}
      <View style={styles.trackWrapper}>
        <View style={styles.track}>
          {/* Accent fill from low to high */}
          <View
            style={[
              styles.fill,
              { left: `${lowPct}%`, right: `${100 - highPct}%` },
            ]}
          />
          {/* Low endpoint */}
          <View style={[styles.endpoint, { left: `${lowPct}%` }]} />
          {/* High endpoint */}
          <View style={[styles.endpoint, { left: `${highPct}%`, marginLeft: -8 }]} />
          {/* Median tick */}
          <View style={[styles.medianTick, { left: `${medianPct}%`, marginLeft: -1 }]} />
          {/* User price marker */}
          <View style={[styles.userMarker, { left: `${userPct}%`, marginLeft: -1 }]} />
        </View>
        {/* YOU label */}
        <View style={[styles.youLabel, { left: `${userPct}%` }]}>
          <Text style={styles.youText}>YOU</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>LOW</Text>
          <Text style={styles.statValue}>${data.low}</Text>
        </View>
        <View style={styles.statColCenter}>
          <Text style={styles.statLabel}>MEDIAN</Text>
          <Text style={styles.statValue}>${data.median}</Text>
          <Text style={styles.statSub}>{data.jobCount} jobs</Text>
        </View>
        <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
          <Text style={styles.statLabel}>HIGH</Text>
          <Text style={styles.statValue}>${data.high}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Match estimate */}
      <View style={styles.matchRow}>
        <Text style={styles.zapIcon}>⚡</Text>
        <Text style={styles.matchText}>
          Likely to match in {data.estimatedMatchMinutes.min}–{data.estimatedMatchMinutes.max} min at your price
        </Text>
      </View>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      gap: Spacing.gap,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerLeft: {
      gap: 3,
    },
    route: {
      fontSize: Typography.sizes.bodySmall,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    period: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
    },
    trendIcon: {
      fontSize: 18,
      color: C.status.green,
    },
    trackWrapper: {
      marginVertical: 8,
    },
    track: {
      height: 4,
      backgroundColor: C.background.elevated,
      borderRadius: 2,
      position: 'relative',
    },
    fill: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      backgroundColor: C.accent,
      borderRadius: 2,
    },
    endpoint: {
      position: 'absolute',
      top: -6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: C.accent,
      borderWidth: 3,
      borderColor: C.background.card,
    },
    medianTick: {
      position: 'absolute',
      top: -4,
      width: 2,
      height: 12,
      backgroundColor: C.background.card,
    },
    userMarker: {
      position: 'absolute',
      top: -10,
      width: 2,
      height: 24,
      backgroundColor: C.text.primary,
    },
    youLabel: {
      position: 'absolute',
      top: 20,
      transform: [{ translateX: -12 }],
    },
    youText: {
      fontSize: Typography.sizes.micro,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
    },
    statCol: {
      gap: 2,
    },
    statColCenter: {
      alignItems: 'center',
      gap: 2,
    },
    statLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: Typography.weights.semibold,
      color: C.text.secondary,
      letterSpacing: 1,
    },
    statValue: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      fontVariant: ['tabular-nums'],
    },
    statSub: {
      fontSize: Typography.sizes.micro,
      color: C.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    divider: {
      height: 1,
      backgroundColor: C.background.divider,
    },
    matchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    zapIcon: {
      fontSize: Typography.sizes.body,
      color: C.accent,
    },
    matchText: {
      fontSize: Typography.sizes.label,
      color: C.text.secondary,
      flex: 1,
    },
  });
}
