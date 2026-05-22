import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useColors, ColorPalette, Typography } from '@constants/theme';

interface EyebrowProps {
  children: React.ReactNode;
}

export function Eyebrow({ children }: EyebrowProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return <Text style={styles.text}>{children}</Text>;
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    text: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: Typography.weights.semibold,
      color: C.text.secondary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
  });
}
