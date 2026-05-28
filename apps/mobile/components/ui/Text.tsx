import React from 'react';
import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';

const weightToFamily: Record<string, string> = {
  '300': 'DMSans_300Light',
  '400': 'DMSans_400Regular',
  '500': 'DMSans_500Medium',
  '600': 'DMSans_600SemiBold',
  '700': 'DMSans_700Bold',
  '800': 'DMSans_800ExtraBold',
  bold: 'DMSans_700Bold',
  normal: 'DMSans_400Regular',
};

export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flat?.fontFamily) {
    return <RNText {...props} style={style} />;
  }
  const weight = String(flat?.fontWeight ?? '400');
  const fontFamily = weightToFamily[weight] ?? 'DMSans_400Regular';
  return <RNText {...props} style={[style, { fontFamily, fontWeight: 'normal' }]} />;
}
