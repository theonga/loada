import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import { updateProfile } from '@services';

export default function NameScreen() {
  const router = useRouter();
  const { role, updateName } = useAuthStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const canContinue = name.trim().length >= 2;

  async function handleContinue() {
    if (!canContinue) return;
    setLoading(true);
    setError('');
    try {
      await updateProfile({ name: name.trim() });
      updateName(name.trim());
      // All new users must accept Terms of Use and Privacy Policy before proceeding.
      router.replace('/(auth)/terms');
    } catch {
      setError('Could not save your name. Please try again.');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>What's your name?</Text>
        <Text style={styles.sub}>This is how drivers and shippers will see you on Loada.</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={C.text.tertiary}
          autoFocus
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={handleContinue}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, (!canContinue || loading) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue || loading}
        >
          {loading
            ? <ActivityIndicator color={C.background.primary} />
            : <Text style={styles.btnText}>Continue</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap },
    heading: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary, marginTop: 32 },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary, lineHeight: 22 },
    input: {
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      paddingHorizontal: 16,
      height: Components.inputHeight,
      color: C.text.primary,
      fontSize: Typography.sizes.body,
      marginTop: 8,
    },
    error: { color: C.status.red, fontSize: Typography.sizes.label },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.4 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
