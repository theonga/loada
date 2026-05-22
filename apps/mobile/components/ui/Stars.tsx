import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useColors, ColorPalette, Typography } from '@constants/theme';

interface StarsProps {
  rating: number;
  count?: number;
  size?: number;
}

export function Stars({ rating, count, size = 14 }: StarsProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const filled = Math.round(rating);
  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text
          key={i}
          style={[
            styles.star,
            { fontSize: size, color: i < filled ? C.accent : C.background.divider },
          ]}
        >
          ★
        </Text>
      ))}
      <Text style={[styles.rating, { fontSize: size * 0.85 }]}>{rating.toFixed(1)}</Text>
      {count !== undefined && (
        <Text style={[styles.count, { fontSize: size * 0.85 }]}>({count})</Text>
      )}
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    star: {
      fontVariant: ['tabular-nums'],
    },
    rating: {
      color: C.text.secondary,
      marginLeft: 3,
      fontVariant: ['tabular-nums'],
      fontWeight: Typography.weights.medium,
    },
    count: {
      color: C.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
  });
}
