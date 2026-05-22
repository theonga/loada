import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import { verifyOTP } from '@services/mock';

export default function OTPScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, setToken, role } = useAuthStore();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const { user, token } = await verifyOTP('mock', code);
      setUser(user);
      setToken(token);
      if (role === 'driver') {
        router.replace('/(auth)/driver-setup/documents');
      } else {
        router.replace('/(shipper)');
      }
    } catch {
      setError('Invalid code. Try again.');
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

        <Text style={styles.heading}>Enter your code</Text>
        <Text style={styles.sub}>Sent to your phone via SMS</Text>

        <TextInput
          style={styles.input}
          placeholder="——————"
          placeholderTextColor={C.text.tertiary}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          maxLength={6}
          autoFocus
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.hint}>In mock mode, any 6-digit code works.</Text>

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, { opacity: code.length === 6 ? 1 : 0.5 }]}
          onPress={handleVerify}
          disabled={code.length !== 6 || loading}
        >
          <Text style={styles.btnText}>{loading ? 'Verifying…' : 'Verify'}</Text>
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
    input: { backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, paddingHorizontal: 16, height: Components.inputHeight, color: C.text.primary, fontSize: Typography.sizes.heading, fontWeight: Typography.weights.bold, letterSpacing: 12, textAlign: 'center', fontVariant: ['tabular-nums'], marginTop: 8 },
    error: { color: C.status.red, fontSize: Typography.sizes.label, textAlign: 'center' },
    hint: { fontSize: Typography.sizes.label, color: C.text.tertiary, textAlign: 'center', fontStyle: 'italic' },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
