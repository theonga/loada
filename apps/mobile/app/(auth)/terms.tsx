import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TERMS_ACCEPTED_KEY = 'legal:termsAcceptedAt';
const PRIVACY_ACCEPTED_KEY = 'legal:privacyAcceptedAt';

export default function TermsAcceptanceScreen() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const canContinue = termsChecked && privacyChecked;

  async function handleContinue() {
    if (!canContinue) return;
    const now = new Date().toISOString();
    // Record consent timestamps locally.
    // TODO: also POST to /v1/users/terms-acceptance with { termsAcceptedAt, privacyAcceptedAt }
    // so consent is recorded server-side for GDPR audit purposes.
    await Promise.all([
      AsyncStorage.setItem(TERMS_ACCEPTED_KEY, now),
      AsyncStorage.setItem(PRIVACY_ACCEPTED_KEY, now),
    ]);
    if (role === 'driver') {
      router.replace('/(auth)/driver-setup/vehicle');
    } else {
      router.replace('/(auth)/shipper-setup');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Before you continue</Text>
        <Text style={styles.sub}>
          Please read and accept our legal agreements to use Loada.
        </Text>

        {role === 'driver' && (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color={C.accent} style={{ marginTop: 1 }} />
            <Text style={styles.noteText}>
              As a driver, the Terms of Use also cover the pay-per-job commission model, document requirements, and conduct obligations.
            </Text>
          </View>
        )}

        <View style={styles.checkboxGroup}>
          <CheckRow
            checked={termsChecked}
            onToggle={() => setTermsChecked((v) => !v)}
            label="I have read and accept the"
            linkLabel="Terms of Use"
            onLinkPress={() => router.push('/(shared)/legal/terms')}
            C={C}
          />

          <View style={styles.divider} />

          <CheckRow
            checked={privacyChecked}
            onToggle={() => setPrivacyChecked((v) => !v)}
            label="I have read and accept the"
            linkLabel="Privacy Policy"
            onLinkPress={() => router.push('/(shared)/legal/privacy')}
            C={C}
          />
        </View>

        <Text style={styles.hint}>
          You can review both documents at any time via Settings → Legal.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.btnText}>Accept & continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------

interface CheckRowProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  linkLabel: string;
  onLinkPress: () => void;
  C: ColorPalette;
}

function CheckRow({ checked, onToggle, label, linkLabel, onLinkPress, C }: CheckRowProps) {
  const styles = useMemo(() => getRowStyles(C), [C]);
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.checkboxHitArea}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Ionicons name="checkmark" size={14} color="#0A0A0A" />}
        </View>
      </Pressable>
      <Text style={styles.label}>
        {label}{' '}
        <Text style={styles.link} onPress={onLinkPress}>
          {linkLabel}
        </Text>
      </Text>
    </View>
  );
}

function getRowStyles(C: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: Spacing.card,
      minHeight: Components.touchMin,
    },
    checkboxHitArea: {
      minWidth: Components.touchMin,
      minHeight: Components.touchMin,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -8,
      marginLeft: -8,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: C.background.divider,
      backgroundColor: C.background.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },
    label: {
      flex: 1,
      fontSize: Typography.sizes.body,
      color: C.text.primary,
      lineHeight: 22,
      paddingTop: 1,
    },
    link: {
      color: C.accent,
      fontWeight: Typography.weights.medium,
      textDecorationLine: 'underline',
    },
  });
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    scroll: { flex: 1 },
    content: { padding: Spacing.screenH, gap: Spacing.section, paddingBottom: 24 },
    heading: {
      fontSize: Typography.sizes.screenTitle,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      marginTop: 16,
    },
    sub: {
      fontSize: Typography.sizes.body,
      color: C.text.secondary,
      lineHeight: 22,
    },
    noteCard: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: 'rgba(245,166,35,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(245,166,35,0.20)',
      borderRadius: Radius.button,
      padding: Spacing.card,
    },
    noteText: {
      flex: 1,
      fontSize: Typography.sizes.label,
      color: C.accent,
      lineHeight: 20,
    },
    checkboxGroup: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      overflow: 'hidden',
    },
    divider: { height: 1, backgroundColor: C.background.divider },
    hint: {
      fontSize: Typography.sizes.label,
      color: C.text.tertiary,
      textAlign: 'center',
      lineHeight: 20,
    },
    footer: {
      padding: Spacing.screenH,
      paddingBottom: Spacing.screenH,
    },
    btn: {
      height: Components.buttonHeight,
      backgroundColor: C.accent,
      borderRadius: Radius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.4 },
    btnText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.background.primary,
    },
  });
}
