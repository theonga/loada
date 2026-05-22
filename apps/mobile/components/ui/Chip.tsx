import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { chipVariants, useColors, Components, Radius, Typography } from '@constants/theme';

type ChipVariant = 'default' | 'amber' | 'green' | 'red' | 'blue';

interface ChipProps {
  variant?: ChipVariant;
  children: React.ReactNode;
}

export function Chip({ variant = 'default', children }: ChipProps) {
  const C = useColors();
  const variants = useMemo(() => chipVariants(C), [C]);
  const v = variants[variant];
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: v.bg, borderColor: v.border },
      ]}
    >
      <Text style={[styles.text, { color: v.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: Components.chipHeight,
    borderRadius: Radius.chip,
    borderWidth: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.sizes.chip,
    fontWeight: '500',
  },
});
