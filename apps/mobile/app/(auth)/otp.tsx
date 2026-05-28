import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Pressable, StyleSheet, TextInput } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import { verifyOTP } from '@services';

const CODE_LENGTH = 6;

export default function OTPScreen() {
  const router = useRouter();
  const { devCode } = useLocalSearchParams<{ devCode?: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { setUser, setToken, role, pendingPhone } = useAuthStore();

  useEffect(() => {
    if (devCode) setCode(devCode);
  }, [devCode]);

  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) return;
    if (!pendingPhone) {
      setError('Phone number missing. Please go back and try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user, token, isNewUser } = await verifyOTP(pendingPhone, code);
      setUser(user);
      setToken(token);
      if (isNewUser) {
        router.replace('/(auth)/name');
      } else if (role === 'driver') {
        router.replace('/(driver)');
      } else {
        router.replace('/(shipper)');
      }
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setError(msg ?? 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError('');
    if (digits.length === CODE_LENGTH) {
      inputRef.current?.blur();
      setTimeout(() => handleVerifyWith(digits), 120);
    }
  };

  const handleVerifyWith = async (digits: string) => {
    if (!pendingPhone) {
      setError('Phone number missing. Please go back and try again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user, token, isNewUser } = await verifyOTP(pendingPhone, digits);
      setUser(user);
      setToken(token);
      if (isNewUser) {
        router.replace('/(auth)/name');
      } else if (role === 'driver') {
        router.replace('/(driver)');
      } else {
        router.replace('/(shipper)');
      }
    } catch (err) {
      const msg = (err as { message?: string }).message;
      setError(msg ?? 'Invalid code. Try again.');
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
        <Text style={styles.sub}>
          Sent to {pendingPhone ?? 'your phone'} via SMS
        </Text>

        {devCode ? (
          <View style={styles.devBanner}>
            <Ionicons name="bug-outline" size={14} color="#F5A623" />
            <Text style={styles.devText}>Dev — code auto-filled: {devCode}</Text>
          </View>
        ) : null}

        {/* Digit boxes — tap anywhere to focus the hidden input */}
        <Pressable style={styles.digitRow} onPress={() => inputRef.current?.focus()}>
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const char = code[i];
            const isActive = i === code.length && !loading;
            const isFilled = i < code.length;
            return (
              <View
                key={i}
                style={[
                  styles.digitBox,
                  isActive && styles.digitBoxActive,
                  isFilled && styles.digitBoxFilled,
                ]}
              >
                {isFilled ? (
                  <Text style={styles.digitChar}>{char}</Text>
                ) : (
                  <View style={[styles.digitPlaceholder, isActive && styles.digitPlaceholderActive]} />
                )}
              </View>
            );
          })}
        </Pressable>

        {/* Hidden input — drives the digit boxes */}
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          value={code}
          onChangeText={handleChange}
          maxLength={CODE_LENGTH}
          autoFocus
          caretHidden
          selectTextOnFocus={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, { opacity: code.length === CODE_LENGTH && !loading ? 1 : 0.5 }]}
          onPress={handleVerify}
          disabled={code.length !== CODE_LENGTH || loading}
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

    digitRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    digitBox: {
      flex: 1,
      height: 64,
      borderRadius: Radius.button,
      backgroundColor: C.background.elevated,
      borderWidth: 1.5,
      borderColor: C.background.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    digitBoxActive: {
      borderColor: C.accent,
      backgroundColor: 'rgba(245,166,35,0.06)',
    },
    digitBoxFilled: {
      borderColor: C.background.divider,
      backgroundColor: C.background.elevated,
    },
    digitChar: {
      fontSize: Typography.sizes.heading,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
      lineHeight: 36,
    },
    digitPlaceholder: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.background.divider,
    },
    digitPlaceholderActive: {
      backgroundColor: C.accent,
      opacity: 0.6,
    },

    hiddenInput: {
      position: 'absolute',
      width: 0,
      height: 0,
      opacity: 0,
    },

    error: { color: C.status.red, fontSize: Typography.sizes.label, textAlign: 'center' },
    devBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,166,35,0.10)', borderWidth: 1, borderColor: 'rgba(245,166,35,0.25)', borderRadius: Radius.button, paddingHorizontal: 12, paddingVertical: 8 },
    devText: { fontSize: Typography.sizes.label, color: '#F5A623', flex: 1 },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
