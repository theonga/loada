import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Spacing, Radius, Components } from '@constants/theme';

interface ScreenErrorProps {
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function ScreenError({ message, onRetry, onBack }: ScreenErrorProps) {
  const C = useColors();
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={40} color={C.status.red} />
      <Text style={[styles.msg, { color: C.text.secondary }]}>
        {message ?? 'Something went wrong. Please try again.'}
      </Text>
      <View style={styles.actions}>
        {onRetry && (
          <Pressable style={[styles.btn, { backgroundColor: C.accent }]} onPress={onRetry}>
            <Text style={[styles.btnText, { color: C.background.primary }]}>Retry</Text>
          </Pressable>
        )}
        {onBack && (
          <Pressable style={[styles.btn, { borderWidth: 1, borderColor: C.background.divider }]} onPress={onBack}>
            <Text style={[styles.btnText, { color: C.text.primary }]}>Go back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenH, gap: Spacing.gap },
  msg: { fontSize: Typography.sizes.body, textAlign: 'center', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: Spacing.gapSm, marginTop: 8 },
  btn: { height: Components.buttonHeight, paddingHorizontal: 24, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: Typography.sizes.body, fontWeight: '600' },
});
