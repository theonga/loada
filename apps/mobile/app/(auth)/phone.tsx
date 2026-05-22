import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { sendOTP } from '@services/mock';

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleContinue = async () => {
    if (phone.length < 9) return;
    setLoading(true);
    await sendOTP(`+263${phone}`);
    setLoading(false);
    router.push('/(auth)/otp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>

        <Text style={styles.heading}>Your phone number</Text>
        <Text style={styles.sub}>We'll send a one-time code to verify</Text>

        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.flag}>🇿🇼</Text>
            <Text style={styles.code}>+263</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="77 123 4567"
            placeholderTextColor={C.text.tertiary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={12}
            autoFocus
          />
        </View>

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, { opacity: phone.length >= 9 ? 1 : 0.5 }]}
          onPress={handleContinue}
          disabled={phone.length < 9 || loading}
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
    inputRow: { flexDirection: 'row', gap: Spacing.gap, marginTop: 8 },
    countryCode: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, paddingHorizontal: 12, height: Components.inputHeight },
    flag: { fontSize: 20 },
    code: { color: C.text.primary, fontSize: Typography.sizes.body, fontWeight: Typography.weights.medium },
    input: { flex: 1, backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, paddingHorizontal: 16, height: Components.inputHeight, color: C.text.primary, fontSize: Typography.sizes.body, fontVariant: ['tabular-nums'] },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
