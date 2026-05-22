import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors, ColorPalette } from '@constants/theme';

interface Point {
  x: number;
  y: number;
}

interface RouteLineProps {
  from: Point;
  to: Point;
}

export function RouteLine({ from, to }: RouteLineProps) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <View
      style={[
        styles.line,
        {
          width: length,
          left: from.x,
          top: from.y,
          transform: [{ rotate: `${angle}deg` }],
        },
      ]}
    />
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    line: {
      position: 'absolute',
      height: 1.5,
      backgroundColor: C.accent,
      opacity: 0.6,
      transformOrigin: '0 50%',
    },
  });
}
