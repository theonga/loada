import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors, ColorPalette, Components } from '@constants/theme';

interface ProgressBarProps {
  pct: number;
  color?: string;
}

export function ProgressBar({ pct, color }: ProgressBarProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const fillColor = color ?? C.accent;
  const clampedPct = Math.max(0, Math.min(100, pct));
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${clampedPct}%`, backgroundColor: fillColor },
        ]}
      />
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    track: {
      height: Components.progressHeight,
      backgroundColor: C.background.divider,
      borderRadius: 1,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 1,
    },
  });
}
