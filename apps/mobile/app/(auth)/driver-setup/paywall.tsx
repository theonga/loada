import React, { useState, useMemo } from 'react';
import {
  View, Pressable, StyleSheet, ScrollView,
  TextInput, ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { useAuthStore } from '@store/auth.store';
import { initiateSubscription, getMySubscription } from '@services';

const PLANS = [
  { id: 'WEEKLY' as const,  label: 'Weekly',  price: '$8',   sub: 'per week',  badge: null },
  { id: 'MONTHLY' as const, label: 'Monthly', price: '$28',  sub: 'per month', badge: 'SAVE 12%' },
  { id: 'ANNUAL' as const,  label: 'Annual',  price: '$280', sub: 'per year',  badge: 'SAVE 32% · BEST' },
];

const ALL_METHODS = [
  { id: 'ecocash'  as const, icon: '🇿🇼', label: 'EcoCash',  zwOnly: true  },
  { id: 'onemoney' as const, icon: '🇿🇼', label: 'OneMoney', zwOnly: true  },
  { id: 'vmc'      as const, icon: '💳', label: 'Visa / MC', zwOnly: false },
] as const;

type PayMethod = 'ecocash' | 'onemoney' | 'vmc';
type Step = 'select' | 'confirm_ecocash' | 'confirm_card' | 'waiting' | 'error';

function isZimbabwePhone(phone: string | null | undefined): boolean {
  return phone?.startsWith('+263') ?? false;
}

export default function DriverPaywallScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isZW = isZimbabwePhone(user?.phone);
  const methods = ALL_METHODS.filter((m) => !m.zwOnly || isZW);

  const [selected, setSelected] = useState<'WEEKLY' | 'MONTHLY' | 'ANNUAL'>('WEEKLY');
  const [method, setMethod] = useState<PayMethod>(isZW ? 'ecocash' : 'vmc');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('select');
  const [error, setError] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  // ─── EcoCash / OneMoney flow ─────────────────────────────────────────────────

  async function handleMobileMoneyPay() {
    if (!phone.trim()) return;
    setStep('waiting');
    setError('');
    try {
      await initiateSubscription({ plan: selected, method, phone: phone.trim() });
      await pollUntilActive();
    } catch {
      setError('Payment initiation failed. Please try again.');
      setStep('error');
    }
  }

  // ─── Visa/Mastercard flow ────────────────────────────────────────────────────

  async function handleCardPay() {
    setStep('waiting');
    setError('');
    try {
      const { redirectUrl } = await initiateSubscription({
        plan: selected,
        method: 'vmc',
        email: email.trim() || undefined,
      });

      if (redirectUrl) {
        // Open Paynow's hosted card page in an in-app browser
        const result = await WebBrowser.openBrowserAsync(redirectUrl, {
          dismissButtonStyle: 'close',
          toolbarColor: '#0A0A0A',
        });
        // User dismissed or completed — start polling regardless
        void result;
      }

      await pollUntilActive();
    } catch {
      setError('Card payment failed. Please try again.');
      setStep('error');
    }
  }

  // ─── Polling ─────────────────────────────────────────────────────────────────

  async function pollUntilActive() {
    const maxAttempts = 30; // 5 min at 10s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await delay(10_000);
      try {
        const sub = await getMySubscription();
        if (sub?.status === 'ACTIVE') {
          router.replace('/(driver)');
          return;
        }
      } catch {
        // ignore transient errors, keep polling
      }
    }
    setError('Payment confirmation timed out. If you paid, please restart the app — your subscription will activate shortly.');
    setStep('error');
  }

  // ─── Waiting screen ───────────────────────────────────────────────────────────

  if (step === 'waiting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.waitTitle}>
            {method === 'vmc' ? 'Waiting for payment…'
              : method === 'ecocash' ? 'Waiting for EcoCash confirmation'
              : 'Waiting for OneMoney confirmation'}
          </Text>
          <Text style={styles.waitSub}>
            {method === 'vmc'
              ? 'Complete the payment in your browser. This screen will update automatically.'
              : 'Check your phone for a payment prompt and confirm.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error screen ─────────────────────────────────────────────────────────────

  if (step === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centred}>
          <Ionicons name="alert-circle-outline" size={56} color={C.status.red} />
          <Text style={styles.waitTitle}>Payment failed</Text>
          <Text style={styles.waitSub}>{error}</Text>
          <Pressable style={[styles.btn, { marginTop: Spacing.gap }]} onPress={() => setStep('select')}>
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── EcoCash / OneMoney phone confirm ─────────────────────────────────────────

  if (step === 'confirm_ecocash') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setStep('select')} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={C.text.primary} />
          </Pressable>
          <Text style={styles.step}>{method === 'ecocash' ? 'Pay with EcoCash' : 'Pay with OneMoney'}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.phoneContent}>
          <Text style={styles.phoneLabel}>{method === 'ecocash' ? 'EcoCash' : 'OneMoney'} number</Text>
          <Text style={styles.phoneSub}>Enter the number that will receive the payment prompt</Text>
          <TextInput
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="+263 77 000 0000"
            placeholderTextColor={C.text.tertiary}
            keyboardType="phone-pad"
          />
          <Pressable
            style={[styles.btn, !phone.trim() && styles.btnDisabled]}
            onPress={handleMobileMoneyPay}
            disabled={!phone.trim()}
          >
            <Text style={styles.btnText}>Send payment prompt</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Card email confirm ────────────────────────────────────────────────────────

  if (step === 'confirm_card') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setStep('select')} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color={C.text.primary} />
          </Pressable>
          <Text style={styles.step}>Pay by card</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.phoneContent}>
          <Text style={styles.phoneLabel}>Email (optional)</Text>
          <Text style={styles.phoneSub}>Paynow will send your receipt here</Text>
          <TextInput
            style={styles.phoneInput}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={C.text.tertiary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Pressable style={styles.btn} onPress={handleCardPay}>
            <Text style={styles.btnText}>Open secure card payment</Text>
          </Pressable>
          <Text style={styles.cardNote}>
            You'll be taken to Paynow's secure page to enter your Visa or Mastercard details.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Plan + method selection ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>4 / 4</Text>
        <View style={{ width: 44 }} />
      </View>
      <ProgressBar pct={100} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Choose your plan</Text>
        <Text style={styles.sub}>Flat fee. No commission per job. Cancel anytime.</Text>

        {/* Plan cards */}
        {PLANS.map((plan) => (
          <Pressable
            key={plan.id}
            style={[styles.planCard, selected === plan.id && styles.planCardSelected]}
            onPress={() => setSelected(plan.id)}
          >
            <View style={styles.planLeft}>
              <View style={[styles.radio, selected === plan.id && styles.radioSelected]}>
                {selected === plan.id && <View style={styles.radioDot} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planLabel}>{plan.label}</Text>
                {plan.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.planRight}>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planSub}>{plan.sub}</Text>
            </View>
          </Pressable>
        ))}

        {/* Payment method */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodRow}>
          {methods.map(({ id, icon, label }) => (
            <Pressable
              key={id}
              style={[styles.methodCard, method === id && styles.methodCardSelected]}
              onPress={() => setMethod(id)}
            >
              <Text style={styles.methodIcon}>{icon}</Text>
              <Text style={[styles.methodLabel, method === id && styles.methodLabelSelected]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {[
            'Unlimited bids per week',
            'Priority in driver search radius',
            'In-app chat with shippers',
            'Proof of delivery tools',
            'Earnings dashboard',
          ].map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark" size={16} color={C.status.green} />
              <Text style={styles.feature}>{f}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.btn}
          onPress={() => {
            if (method === 'vmc') setStep('confirm_card');
            else setStep('confirm_ecocash');
          }}
        >
          <Text style={styles.btnText}>
            {method === 'vmc' ? 'Pay by card' : `Pay with ${method === 'ecocash' ? 'EcoCash' : 'OneMoney'}`}
          </Text>
        </Pressable>
        <Text style={styles.terms}>Renews automatically. Cancel in-app anytime.</Text>
      </View>
    </SafeAreaView>
  );
}

function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screenH },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    step: { fontSize: Typography.sizes.label, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.gap },
    heading: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary, lineHeight: 22 },
    planCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    planCardSelected: { borderColor: C.accent },
    planLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gap },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.background.divider, alignItems: 'center', justifyContent: 'center' },
    radioSelected: { borderColor: C.accent },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },
    planInfo: { gap: 4 },
    planLabel: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    badge: { backgroundColor: 'rgba(245,166,35,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
    badgeText: { fontSize: Typography.sizes.micro, fontWeight: Typography.weights.semibold, color: C.accent, letterSpacing: 0.5 },
    planRight: { alignItems: 'flex-end' },
    planPrice: { fontSize: Typography.sizes.price, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'] },
    planSub: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    sectionLabel: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2, marginTop: 4 },
    methodRow: { flexDirection: 'row', gap: Spacing.gapSm },
    methodCard: { flex: 1, backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: 12, alignItems: 'center', gap: 6 },
    methodCardSelected: { borderColor: C.accent, backgroundColor: 'rgba(245,166,35,0.06)' },
    methodIcon: { fontSize: 22 },
    methodLabel: { fontSize: Typography.sizes.chip, fontWeight: Typography.weights.medium, color: C.text.secondary, textAlign: 'center' },
    methodLabelSelected: { color: C.accent },
    featuresCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gapSm },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm },
    feature: { fontSize: Typography.sizes.body, color: C.text.secondary, flex: 1 },
    footer: { padding: Spacing.screenH, gap: Spacing.gapSm },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    terms: { textAlign: 'center', fontSize: Typography.sizes.chip, color: C.text.tertiary },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenH, gap: Spacing.gap },
    waitTitle: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary, textAlign: 'center' },
    waitSub: { fontSize: Typography.sizes.body, color: C.text.secondary, textAlign: 'center', lineHeight: 22 },
    phoneContent: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap },
    phoneLabel: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    phoneSub: { fontSize: Typography.sizes.label, color: C.text.secondary, lineHeight: 20 },
    phoneInput: { backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, paddingHorizontal: 14, height: Components.inputHeight, color: C.text.primary, fontSize: Typography.sizes.body },
    cardNote: { fontSize: Typography.sizes.chip, color: C.text.tertiary, textAlign: 'center', lineHeight: 18 },
  });
}
