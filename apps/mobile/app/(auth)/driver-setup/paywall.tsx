import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';

const PLANS = [
  { id: 'WEEKLY', label: 'Weekly', price: '$8', sub: 'per week', badge: null },
  { id: 'MONTHLY', label: 'Monthly', price: '$28', sub: 'per month', badge: 'SAVE 12%' },
  { id: 'ANNUAL', label: 'Annual', price: '$280', sub: 'per year', badge: 'SAVE 32% · BEST' },
] as const;

export default function DriverPaywallScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string>('WEEKLY');
  const [loading, setLoading] = useState(false);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleSubscribe = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    router.replace('/(driver)');
  };

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
        <Text style={styles.sub}>Flat weekly fee. No commission per job. Cancel anytime.</Text>

        {PLANS.map((plan) => (
          <Pressable
            key={plan.id}
            style={[styles.planCard, selected === plan.id && styles.planCardSelected]}
            onPress={() => setSelected(plan.id)}
          >
            <View style={styles.planLeft}>
              <View style={styles.radio}>
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
        <Pressable style={styles.btn} onPress={handleSubscribe} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Processing…' : 'Subscribe with EcoCash'}</Text>
        </Pressable>
        <Text style={styles.terms}>Renews automatically. Cancel in-app anytime.</Text>
      </View>
    </SafeAreaView>
  );
}

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
    planCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    planCardSelected: { borderColor: C.accent },
    planLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gap },
    radio: {
      width: 20, height: 20, borderRadius: 10, borderWidth: 2,
      borderColor: C.background.divider, alignItems: 'center', justifyContent: 'center',
    },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent },
    planInfo: { gap: 4 },
    planLabel: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    badge: { backgroundColor: 'rgba(245,166,35,0.15)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
    badgeText: { fontSize: Typography.sizes.micro, fontWeight: Typography.weights.semibold, color: C.accent, letterSpacing: 0.5 },
    planRight: { alignItems: 'flex-end' },
    planPrice: { fontSize: Typography.sizes.price, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'] },
    planSub: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    featuresCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      gap: Spacing.gapSm,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm },
    feature: { fontSize: Typography.sizes.body, color: C.text.secondary, flex: 1 },
    footer: { padding: Spacing.screenH, gap: Spacing.gapSm },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    terms: { textAlign: 'center', fontSize: Typography.sizes.chip, color: C.text.tertiary },
  });
}
