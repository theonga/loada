import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors, ColorPalette } from '@constants/theme';

interface MapBgProps {
  children?: React.ReactNode;
}

const GRID_SPACING = 40;

export function MapBg({ children }: MapBgProps) {
  const cols = Math.ceil(400 / GRID_SPACING);
  const rows = Math.ceil(800 / GRID_SPACING);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <View style={styles.container}>
      {/* Vertical grid lines */}
      {Array.from({ length: cols }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={[styles.vLine, { left: i * GRID_SPACING }]}
        />
      ))}
      {/* Horizontal grid lines */}
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={[styles.hLine, { top: i * GRID_SPACING }]}
        />
      ))}
      {children}
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background.card,
      position: 'relative',
    },
    vLine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: C.background.divider,
      opacity: 0.4,
    },
    hLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: C.background.divider,
      opacity: 0.4,
    },
  });
}
