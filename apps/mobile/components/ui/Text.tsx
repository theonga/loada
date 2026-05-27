import React from 'react';
import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';

const weightToFamily: Record<string, string> = {
  '300': 'OpenSans_300Light',
  '400': 'OpenSans_400Regular',
  '500': 'OpenSans_500Medium',
  '600': 'OpenSans_600SemiBold',
  '700': 'OpenSans_700Bold',
  bold: 'OpenSans_700Bold',
  normal: 'OpenSans_400Regular',
};

export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  if (flat?.fontFamily) {
    return <RNText {...props} style={style} />;
  }
  const weight = String(flat?.fontWeight ?? '400');
  const fontFamily = weightToFamily[weight] ?? 'OpenSans_400Regular';
  return <RNText {...props} style={[style, { fontFamily }]} />;
}
