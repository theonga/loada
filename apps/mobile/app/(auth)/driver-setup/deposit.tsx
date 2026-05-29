import React, { useState, useMemo } from 'react';
import {
  View, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useColors, ColorPalette, Typography, Spacing, Radius, Components,
} from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { initiateWalletDeposit } from '@services';
import { showAlert, showError } from '@components/ui/AppAlert';

type DepositState = 'idle' | 'sending' | 'sent';

const MIN_DEPOSIT = 10;

const PAYMENT_METHODS = [
  { id: 'ecocash'  as const, label: 'EcoCash',          icon: 'phone-portrait-outline' as const },
  { id: 'onemoney' as const, label: 'OneMoney',          icon: 'phone-portrait-outline' as const },
  { id: 'vmc'      as const, label: 'Visa / Mastercard', icon: 'card-outline'           as const },
];

export default function DepositScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const [amount, setAmount] = useState('10');
  const [method, setMethod] = useState<'ecocash' | 'onemoney' | 'vmc'>('ecocash');
  const [phone, setPhone] = useState('');
  const [depositState, setDepositState] = useState<DepositState>('idle');
  const [infoExpanded, setInfoExpanded] = useState(false);

  const numAmount = parseInt(amount, 10) || 0;
  const isValid = numAmount >= MIN_DEPOSIT;
  const needsPhone = method === 'ecocash' || method === 'onemoney';

  async function handleDeposit() {
    if (!isValid || depositState === 'sending') return;
    if (needsPhone && !phone.trim()) {
      showError(
        `Enter your mobile number to pay with ${method === 'ecocash' ? 'EcoCash' : 'OneMoney'}.`,
        'Phone number required',
      );
      return;
    }
    setDepositState('sending');
    try {
      await initiateWalletDeposit({ amount: numAmount, method, phone: needsPhone ? phone : undefined });
      setDepositState('sent');
    } catch (err) {
      setDepositState('idle');
      const raw = (err as Error).message ?? '';
      showAlert({
        icon: 'alert-circle-outline',
        iconVariant: 'destructive',
        title: 'Deposit failed',
        message: raw || 'Could not reach the payment provider. Check your connection and try again.',
        buttons: [{ label: 'OK', variant: 'default' }],
      });
    }
  }

  // ── Payment status screen (mirrors wallet screen) ───────────────────────
  if (depositState === 'sending' || depositState === 'sent') {
    const isSending = depositState === 'sending';
    const isMobileMoney = method === 'ecocash' || method === 'onemoney';
    const methodName = method === 'ecocash' ? 'EcoCash' : method === 'onemoney' ? 'OneMoney' : 'Card';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            onPress={isSending ? undefined : () => setDepositState('idle')}
            style={[styles.closeBtn, isSending && { opacity: 0.3 }]}
            disabled={isSending}
          >
            <Ionicons name="arrow-back" size={24} color={C.text.primary} />
          </Pressable>
          <Text style={styles.step}>3 / 3</Text>
          <View style={{ width: 44 }} />
        </View>
        <ProgressBar pct={100} />

        <View style={styles.statusScreen}>
          <View style={styles.statusIconWrap}>
            {isSending ? (
              <ActivityIndicator color={C.accent} size="large" />
            ) : (
              <Ionicons
                name={isMobileMoney ? 'phone-portrait' : 'card'}
                size={40}
                color={C.accent}
              />
            )}
          </View>

          <Text style={styles.statusTitle}>
            {isSending
              ? 'Initiating payment…'
              : isMobileMoney ? `Check your ${methodName} app` : 'Complete your payment'}
          </Text>
          <Text style={styles.statusSub}>
            {isSending
              ? 'Contacting Paynow. Please wait.'
              : isMobileMoney
                ? `A $${numAmount} payment prompt was sent to ${phone}. Open ${methodName} and approve it.`
                : `Your $${numAmount} card payment has been initiated. Complete it in your browser.`}
          </Text>

          <View style={styles.steps}>
            <StatusStep C={C} icon="checkmark-circle" label="Payment initiated" state="done" />
            <StepLine C={C} done={!isSending} />
            <StatusStep
              C={C}
              icon={isMobileMoney ? 'phone-portrait' : 'globe-outline'}
              label={isMobileMoney ? 'Confirm on your phone' : 'Approve in browser'}
              state={isSending ? 'waiting' : 'active'}
            />
            <StepLine C={C} done={false} />
            <StatusStep C={C} icon="wallet-outline" label="Balance updated" state="waiting" />
          </View>

          {!isSending && (
            <Text style={styles.statusHint}>
              Your balance will update automatically once confirmed.
            </Text>
          )}
        </View>

        {!isSending && (
          <View style={styles.footer}>
            <Pressable style={styles.btn} onPress={() => router.replace('/(driver)')}>
              <Text style={styles.btnText}>Continue to app</Text>
            </Pressable>
            <Pressable onPress={() => setDepositState('idle')}>
              <Text style={styles.skip}>Make another deposit</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── Deposit form (idle) ─────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>3 / 3</Text>
        <View style={{ width: 44 }} />
      </View>
      <ProgressBar pct={100} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Fund your wallet</Text>
          <Text style={styles.sub}>
            Loada charges a small commission per job — not a subscription. Deposit funds to start bidding.
          </Text>

          {/* How Loada fees work — collapsible */}
          <Pressable style={styles.infoCard} onPress={() => setInfoExpanded((v) => !v)}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>How Loada fees work</Text>
              <Ionicons name={infoExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.accent} />
            </View>
            {infoExpanded && (
              <View style={styles.infoRows}>
                {[
                  { icon: 'wallet-outline' as const,            text: 'You deposit funds into your Loada wallet' },
                  { icon: 'pricetag-outline' as const,          text: 'A small % is reserved when you bid (returned if not chosen)' },
                  { icon: 'checkmark-circle-outline' as const,  text: 'Commission is only deducted when you complete a job' },
                ].map(({ icon, text }) => (
                  <View key={text} style={styles.infoRow}>
                    <Ionicons name={icon} size={15} color={C.accent} />
                    <Text style={styles.infoText}>{text}</Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>Top-up amount (USD)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor={C.text.tertiary}
              />
            </View>
            {numAmount > 0 && numAmount < MIN_DEPOSIT && (
              <Text style={styles.minWarn}>Minimum deposit is ${MIN_DEPOSIT}</Text>
            )}
            <View style={styles.quickAmounts}>
              {[10, 20, 50, 100].map((v) => (
                <Pressable
                  key={v}
                  style={[styles.quickBtn, String(v) === amount && styles.quickBtnActive]}
                  onPress={() => setAmount(String(v))}
                >
                  <Text style={[styles.quickBtnText, String(v) === amount && styles.quickBtnTextActive]}>
                    ${v}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.label}>Pay via</Text>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.methodRow, method === m.id && styles.methodRowActive]}
                onPress={() => setMethod(m.id)}
              >
                <Ionicons name={m.icon} size={20} color={method === m.id ? C.accent : C.text.secondary} />
                <Text style={[styles.methodLabel, method === m.id && { color: C.accent }]}>{m.label}</Text>
                <View style={[styles.radio, method === m.id && styles.radioActive]}>
                  {method === m.id && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            ))}
          </View>

          {needsPhone && (
            <View style={styles.section}>
              <Text style={styles.label}>Mobile number</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+263 7X XXX XXXX"
                placeholderTextColor={C.text.tertiary}
                keyboardType="phone-pad"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !isValid && styles.btnDisabled]}
          onPress={handleDeposit}
          disabled={!isValid}
        >
          <Text style={styles.btnText}>Deposit ${numAmount || MIN_DEPOSIT}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/(driver)')}>
          <Text style={styles.skip}>Skip — I'll deposit later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ── Step sub-components (identical to wallet screen) ────────────────────────

function StatusStep({
  C, icon, label, state,
}: { C: ColorPalette; icon: string; label: string; state: 'done' | 'active' | 'waiting' }) {
  const color =
    state === 'done'   ? C.status.green :
    state === 'active' ? C.accent :
                         C.text.tertiary;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor:
          state === 'done'   ? 'rgba(0,200,83,0.12)' :
          state === 'active' ? 'rgba(245,166,35,0.12)' :
                               'rgba(74,74,74,0.2)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon as never} size={18} color={color} />
      </View>
      <Text style={{
        fontSize: Typography.sizes.body,
        fontWeight: state === 'active' ? Typography.weights.semibold : Typography.weights.regular,
        color,
      }}>
        {label}
      </Text>
      {state === 'done' && (
        <Ionicons name="checkmark" size={16} color={C.status.green} style={{ marginLeft: 'auto' }} />
      )}
    </View>
  );
}

function StepLine({ C, done }: { C: ColorPalette; done: boolean }) {
  return (
    <View style={{
      width: 2, height: 16, marginLeft: 17,
      backgroundColor: done ? C.status.green : C.background.divider,
    }} />
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.screenH, paddingVertical: 12,
    },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    step: { fontSize: Typography.sizes.label, color: C.text.secondary, fontVariant: ['tabular-nums'] },

    scrollContent: { padding: Spacing.screenH, gap: Spacing.section, paddingBottom: 24 },
    heading: {
      fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold,
      color: C.text.primary,
    },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary, lineHeight: 22 },

    // Info card — matches wallet screen exactly
    infoCard: {
      backgroundColor: 'rgba(245,166,35,0.06)',
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: 'rgba(245,166,35,0.15)',
      padding: Spacing.card,
      gap: 6,
    },
    infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    infoTitle: {
      fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.accent,
    },
    infoRows: { gap: 10, marginTop: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    infoText: {
      flex: 1, fontSize: Typography.sizes.label, color: C.text.secondary, lineHeight: 20,
    },

    // Form — matches wallet screen exactly
    section: { gap: Spacing.gap },
    label: { fontSize: Typography.sizes.label, color: C.text.secondary },
    amountRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider,
      paddingHorizontal: Spacing.card, paddingVertical: 12,
    },
    currencySymbol: {
      fontSize: Typography.sizes.heading, fontWeight: Typography.weights.light,
      color: C.text.secondary, marginRight: 4,
    },
    amountInput: {
      flex: 1, fontSize: Typography.sizes.heading, fontWeight: Typography.weights.bold,
      color: C.text.primary, fontVariant: ['tabular-nums'],
      textAlignVertical: 'center', includeFontPadding: false, padding: 0,
    },
    minWarn: { fontSize: Typography.sizes.chip, color: C.status.amber },
    quickAmounts: { flexDirection: 'row', gap: Spacing.gapSm },
    quickBtn: {
      flex: 1, height: 36, borderRadius: Radius.button,
      borderWidth: 1, borderColor: C.background.divider,
      backgroundColor: C.background.elevated, alignItems: 'center', justifyContent: 'center',
    },
    quickBtnActive: { borderColor: C.accent, backgroundColor: 'rgba(245,166,35,0.08)' },
    quickBtnText: { fontSize: Typography.sizes.body, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    quickBtnTextActive: { color: C.accent, fontWeight: Typography.weights.semibold },
    methodRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.gap,
      padding: Spacing.card, borderRadius: Radius.button,
      borderWidth: 1, borderColor: C.background.divider,
      backgroundColor: C.background.card, minHeight: Components.touchMin,
    },
    methodRowActive: { borderColor: C.accent, backgroundColor: 'rgba(245,166,35,0.06)' },
    methodLabel: { flex: 1, fontSize: Typography.sizes.body, color: C.text.primary },
    radio: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 1.5, borderColor: C.background.divider,
      alignItems: 'center', justifyContent: 'center',
    },
    radioActive: { borderColor: C.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },
    phoneInput: {
      height: Components.inputHeight, backgroundColor: C.background.elevated,
      borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider,
      paddingHorizontal: Spacing.card, fontSize: Typography.sizes.body, color: C.text.primary,
    },

    // Footer
    footer: { padding: Spacing.screenH, gap: Spacing.gapSm, paddingBottom: 32 },
    btn: {
      height: Components.buttonHeight, backgroundColor: C.accent,
      borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.5 },
    btnText: {
      fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold,
      color: C.background.primary,
    },
    skip: { textAlign: 'center', fontSize: Typography.sizes.label, color: C.text.tertiary },

    // Payment status screen — mirrors wallet screen
    statusScreen: {
      flex: 1, paddingHorizontal: Spacing.screenH, paddingTop: 48, gap: 20,
    },
    statusIconWrap: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: 'rgba(245,166,35,0.10)',
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center', marginBottom: 4,
    },
    statusTitle: {
      fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.semibold,
      color: C.text.primary, textAlign: 'center',
    },
    statusSub: {
      fontSize: Typography.sizes.body, color: C.text.secondary,
      textAlign: 'center', lineHeight: 22,
    },
    steps: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider,
      padding: Spacing.card, gap: 0, marginTop: 8,
    },
    statusHint: {
      fontSize: Typography.sizes.chip, color: C.text.tertiary, textAlign: 'center',
    },
  });
}
