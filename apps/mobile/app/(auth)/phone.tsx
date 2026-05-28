import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, Keyboard } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { CountryPicker } from '@components/ui/CountryPicker';
import { DEFAULT_COUNTRY } from '@constants/countries';
import type { Country } from '@constants/countries';
import { sendOTP } from '@services';
import { useAuthStore } from '@store/auth.store';

export default function PhoneScreen() {
  const router = useRouter();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setPendingPhone } = useAuthStore();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const isValid = phone.replace(/\s/g, '').length >= country.minDigits;

  const handlePhoneChange = (text: string) => {
    // Strip leading zero — users often type 0773... instead of 773...
    const cleaned = text.replace(/\D/g, '').replace(/^0+/, '');
    setPhone(cleaned);
    if (cleaned.length >= country.minDigits) {
      Keyboard.dismiss();
    }
  };

  const handleContinue = async () => {
    if (!isValid) return;
    const digits = phone.replace(/\D/g, '');
    const fullPhone = `${country.dial}${digits}`;
    setLoading(true);
    setError('');
    try {
      const { devOtp } = await sendOTP(fullPhone);
      setPendingPhone(fullPhone);
      router.push({ pathname: '/(auth)/otp', params: devOtp ? { devCode: devOtp } : {} });
    } catch {
      setError('Could not send code. Check your number and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>

        <Text style={styles.heading}>Your phone number</Text>
        <Text style={styles.sub}>We'll send a one-time code to verify</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputRow}>
          <CountryPicker value={country} onChange={(c) => { setCountry(c); setPhone(''); }} />
          <TextInput
            style={styles.input}
            placeholder={country.code === 'ZW' ? '77 123 4567' : 'Phone number'}
            placeholderTextColor={C.text.tertiary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={handlePhoneChange}
            maxLength={country.minDigits}
            autoFocus
          />
        </View>

        <Text style={styles.hint}>{country.dial} · {country.name}</Text>

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, !isValid && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
        >
          <Text style={styles.btnText}>{loading ? 'Sending code…' : 'Send code'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap },
    backBtn: { minHeight: Components.touchMin, justifyContent: 'center', alignSelf: 'flex-start' },
    heading: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary, marginTop: 16 },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary },
    error: { color: '#F44336', fontSize: Typography.sizes.label, textAlign: 'center' },
    inputRow: { flexDirection: 'row', gap: Spacing.gap, marginTop: 8 },
    input: { flex: 1, backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, paddingHorizontal: 16, height: Components.inputHeight, color: C.text.primary, fontSize: Typography.sizes.body, fontVariant: ['tabular-nums'] },
    hint: { fontSize: Typography.sizes.chip, color: C.text.tertiary, marginTop: -4 },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
