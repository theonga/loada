import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useColors, ColorPalette, Typography } from '@constants/theme';

type PinKind = 'me' | 'driver' | 'load' | 'origin' | 'dest';

interface MapPinProps {
  kind: PinKind;
  label?: string;
  scale?: number;
}

function getPinConfig(C: ColorPalette): Record<PinKind, { bg: string; dotColor: string; size: number }> {
  return {
    me: { bg: C.accent, dotColor: C.background.primary, size: 16 },
    driver: { bg: C.status.blue, dotColor: '#FFFFFF', size: 14 },
    load: { bg: C.status.green, dotColor: '#FFFFFF', size: 14 },
    origin: { bg: '#FFFFFF', dotColor: C.background.primary, size: 12 },
    dest: { bg: C.accent, dotColor: C.background.primary, size: 12 },
  };
}

export function MapPin({ kind, label, scale = 1 }: MapPinProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const pinConfig = useMemo(() => getPinConfig(C), [C]);
  const { bg, dotColor, size } = pinConfig[kind];
  const scaledSize = size * scale;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.outer,
          {
            width: scaledSize + 6,
            height: scaledSize + 6,
            borderRadius: (scaledSize + 6) / 2,
            backgroundColor: bg + '33',
          },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: scaledSize,
              height: scaledSize,
              borderRadius: scaledSize / 2,
              backgroundColor: bg,
            },
          ]}
        >
          <View
            style={[
              styles.dot,
              {
                width: scaledSize * 0.4,
                height: scaledSize * 0.4,
                borderRadius: (scaledSize * 0.4) / 2,
                backgroundColor: dotColor,
              },
            ]}
          />
        </View>
      </View>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      alignItems: 'center',
    },
    outer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    inner: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {},
    label: {
      fontSize: Typography.sizes.micro,
      color: C.text.primary,
      marginTop: 2,
      fontWeight: Typography.weights.semibold,
    },
  });
}
