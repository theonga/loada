import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useColors, ColorPalette, Components, Radius, Typography } from '@constants/theme';

interface PillProps {
  active?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

export function Pill({ active = false, onPress, children }: PillProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        active ? styles.active : styles.inactive,
      ]}
    >
      <Text style={[styles.text, active ? styles.activeText : styles.inactiveText]}>
        {children}
      </Text>
    </Pressable>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    pill: {
      height: Components.pillHeight,
      borderRadius: Radius.pill,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: Components.touchMin,
    },
    active: {
      backgroundColor: C.accent,
    },
    inactive: {
      backgroundColor: C.background.elevated,
    },
    text: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.semibold,
    },
    activeText: {
      color: C.background.primary,
    },
    inactiveText: {
      color: C.text.secondary,
    },
  });
}
