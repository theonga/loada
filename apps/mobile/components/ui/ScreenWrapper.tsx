import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette } from '@constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenWrapper({ children, style, edges = ['top', 'bottom'] }: ScreenWrapperProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: C.background.primary,
    },
    inner: {
      flex: 1,
    },
  });
}
