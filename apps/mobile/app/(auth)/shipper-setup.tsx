import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { updateShipperProfile } from '@services';

export default function ShipperSetupScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue(skipCompany = false) {
    setLoading(true);
    setError('');
    try {
      await updateShipperProfile({ companyName: skipCompany || !companyName.trim() ? null : companyName.trim() });
      router.replace('/(shipper)');
    } catch {
      setError('Could not save profile. Please try again.');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Your business</Text>
        <Text style={styles.sub}>
          Add a company name so drivers know who they're hauling for. This is optional — your personal name is always shown.
        </Text>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>Company name (optional)</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="e.g. Harare Fresh Produce Ltd"
            placeholderTextColor={C.text.tertiary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => handleContinue()}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={() => handleContinue()}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={C.background.primary} />
            : <Text style={styles.btnText}>
                {companyName.trim() ? 'Continue' : 'Continue without company name'}
              </Text>}
        </Pressable>

        {companyName.trim().length > 0 && (
          <Pressable onPress={() => handleContinue(true)} disabled={loading}>
            <Text style={styles.skip}>Skip — just use my name</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap },
    heading: {
      fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold,
      color: C.text.primary, marginTop: 32,
    },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary, lineHeight: 22 },
    inputWrap: { gap: 6 },
    label: { fontSize: Typography.sizes.label, color: C.text.secondary },
    input: {
      backgroundColor: C.background.elevated, borderRadius: Radius.button,
      borderWidth: 1, borderColor: C.background.divider,
      paddingHorizontal: 16, height: Components.inputHeight,
      color: C.text.primary, fontSize: Typography.sizes.body,
    },
    error: { color: C.status.red, fontSize: Typography.sizes.label },
    spacer: { flex: 1 },
    btn: {
      height: Components.buttonHeight, backgroundColor: C.accent,
      borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    skip: { textAlign: 'center', fontSize: Typography.sizes.label, color: C.text.tertiary, paddingVertical: 8 },
  });
}
