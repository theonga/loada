import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, ColorPalette, Typography } from '@constants/theme';

interface ImgBoxProps {
  width: number | string;
  height: number;
  label?: string;
  borderRadius?: number;
}

export function ImgBox({ width, height, label, borderRadius = 0 }: ImgBoxProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const gradient: [string, string, string, string] =
    C.background.primary === '#0A0A0A'
      ? ['#1A1A1A', '#161616', '#1A1A1A', '#161616']
      : ['#EAEAEA', '#E0E0E0', '#EAEAEA', '#E0E0E0'];
  return (
    <View style={[styles.container, { width: width as number, height, borderRadius }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: Typography.sizes.micro,
      color: C.text.tertiary,
      fontFamily: 'DMMono_400Regular',
    },
  });
}
