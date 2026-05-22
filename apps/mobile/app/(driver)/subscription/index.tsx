import React, { useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Chip } from '@components/ui/Chip';
import { MOCK_SUBSCRIPTION } from '@services/mock/data';

export default function SubscriptionScreen() {
  const router = useRouter();
  const sub = MOCK_SUBSCRIPTION;
  const renewsIn = Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Subscription</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.activeCard}>
          <View style={styles.activeRow}>
            <View>
              <Text style={styles.planName}>Weekly Plan</Text>
              <Text style={styles.planPrice}>$8 / week</Text>
            </View>
            <Chip variant="green">ACTIVE</Chip>
          </View>
          <Text style={styles.renewsIn}>Renews in {renewsIn} days</Text>
          <Text style={styles.ref}>Ref: {sub.paynowReference}</Text>
        </View>

        <View style={styles.infoCard}>
          {[
            'Unlimited bids',
            'Priority search radius',
            'In-app chat',
            'Proof of delivery tools',
            'Earnings dashboard',
          ].map((f) => (
            <View key={f} style={styles.featureRow}>
              <Ionicons name="checkmark" size={16} color={C.status.green} />
              <Text style={styles.feature}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Payment history</Text>
          {[
            { date: '14 May 2026', amount: '$8', ref: 'PNW-2026-05-0042' },
            { date: '7 May 2026', amount: '$8', ref: 'PNW-2026-05-0019' },
            { date: '30 Apr 2026', amount: '$8', ref: 'PNW-2026-04-0087' },
          ].map((p) => (
            <View key={p.ref} style={styles.paymentRow}>
              <View>
                <Text style={styles.paymentDate}>{p.date}</Text>
                <Text style={styles.paymentRef}>{p.ref}</Text>
              </View>
              <Text style={styles.paymentAmount}>{p.amount}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel subscription</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    content: { padding: Spacing.screenH, gap: Spacing.gap },
    activeCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.status.green, padding: Spacing.card, gap: Spacing.gapSm },
    activeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planName: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    planPrice: { fontSize: Typography.sizes.body, color: C.accent, fontWeight: Typography.weights.bold, marginTop: 2 },
    renewsIn: { fontSize: Typography.sizes.label, color: C.text.secondary },
    ref: { fontSize: Typography.sizes.chip, color: C.text.tertiary },
    infoCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gapSm },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm },
    feature: { fontSize: Typography.sizes.body, color: C.text.secondary, flex: 1 },
    historyCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gap },
    historyTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.text.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    paymentDate: { fontSize: Typography.sizes.body, color: C.text.primary },
    paymentRef: { fontSize: Typography.sizes.chip, color: C.text.tertiary },
    paymentAmount: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    cancelBtn: { alignItems: 'center', paddingVertical: 16 },
    cancelText: { fontSize: Typography.sizes.body, color: C.status.red },
  });
}
