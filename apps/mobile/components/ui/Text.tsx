import React from 'react';
import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';

// Single family — Source Sans 3 — for all weights.
const weightToFamily: Record<string, string> = {
  '300': 'SourceSans3_300Light',
  '400': 'SourceSans3_400Regular',
  '500': 'SourceSans3_500Medium',
  '600': 'SourceSans3_600SemiBold',
  '700': 'SourceSans3_700Bold',
  bold: 'SourceSans3_700Bold',
  normal: 'SourceSans3_400Regular',
};

export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flat?.fontFamily) {
    return <RNText {...props} style={style} />;
  }
  const weight = String(flat?.fontWeight ?? '400');
  const fontFamily = weightToFamily[weight] ?? 'SourceSans3_400Regular';
  return <RNText {...props} style={[style, { fontFamily }]} />;
}
