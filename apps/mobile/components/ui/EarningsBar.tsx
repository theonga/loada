import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useColors, ColorPalette, Radius, Typography } from '@constants/theme';

interface BarData {
  value: number;
  label?: string;
}

interface EarningsBarProps {
  data: BarData[];
  average: number;
  labels?: string[];
}

const BAR_MAX_HEIGHT = 80;
const BAR_WIDTH = 24;

export function EarningsBar({ data, average, labels }: EarningsBarProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((d, i) => {
          const heightPct = d.value / maxValue;
          const barHeight = Math.max(2, heightPct * BAR_MAX_HEIGHT);
          return (
            <View key={i} style={styles.barGroup}>
              <Text style={styles.amount}>{d.value > 0 ? `$${d.value}` : ''}</Text>
              <View style={[styles.bar, { height: barHeight }]} />
              {labels && <Text style={styles.dayLabel}>{labels[i]}</Text>}
            </View>
          );
        })}
      </View>
      <View style={styles.avgRow}>
        <View style={styles.avgLine} />
        <Text style={styles.avgLabel}>avg ${average}</Text>
      </View>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: {
      gap: 4,
    },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      height: BAR_MAX_HEIGHT + 20,
    },
    barGroup: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      flex: 1,
    },
    amount: {
      fontSize: Typography.sizes.eyebrow,
      color: C.text.secondary,
      fontVariant: ['tabular-nums'],
    },
    bar: {
      width: BAR_WIDTH,
      backgroundColor: C.accent,
      borderRadius: Radius.chip,
    },
    dayLabel: {
      fontSize: Typography.sizes.micro,
      color: C.text.tertiary,
    },
    avgRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avgLine: {
      flex: 1,
      height: 1,
      backgroundColor: C.background.divider,
      borderStyle: 'dashed',
    },
    avgLabel: {
      fontSize: Typography.sizes.eyebrow,
      color: C.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
  });
}
