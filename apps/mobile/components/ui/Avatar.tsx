import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useColors, ColorPalette, Components, Typography } from '@constants/theme';

interface AvatarProps {
  name: string;
  size: number;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (
    words[0].charAt(0).toUpperCase() +
    words[words.length - 1].charAt(0).toUpperCase()
  );
}

export function Avatar({ name, size }: AvatarProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    circle: {
      backgroundColor: C.background.elevated,
      borderWidth: Components.avatarBorder,
      borderColor: C.background.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      color: C.text.primary,
      fontWeight: Typography.weights.semibold,
    },
  });
}
