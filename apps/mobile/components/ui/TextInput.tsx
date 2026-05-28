import React from 'react';
import { TextInput as RNTextInput, TextInputProps, StyleSheet, TextStyle } from 'react-native';

interface Props extends TextInputProps {
  inputRef?: React.RefObject<RNTextInput | null>;
}

export function TextInput({ style, inputRef, ...props }: Props) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontFamily = flat?.fontFamily ?? 'DMSans_400Regular';
  return <RNTextInput ref={inputRef} {...props} style={[style, { fontFamily, fontWeight: 'normal' }]} />;
}
