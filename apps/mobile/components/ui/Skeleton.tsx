import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useColors, ColorPalette } from '@constants/theme';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
}

export function Skeleton({ width, height, borderRadius = 4 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width: width as number,
          height,
          borderRadius,
          opacity,
        },
      ]}
    />
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    base: {
      backgroundColor: C.background.elevated,
    },
  });
}
