import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { EarningsBar } from '@components/ui/EarningsBar';
import { MOCK_JOBS, MOCK_EARNINGS } from '@services/mock/data';
import { placeBid } from '@services/mock';

export default function PlaceBidScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const job = MOCK_JOBS.find((j) => j.id === jobId) ?? MOCK_JOBS[0];
  const [price, setPrice] = useState(String(Math.round(job.askingPrice * 0.96)));
  const [loading, setLoading] = useState(false);
  const numPrice = parseInt(price, 10) || 0;
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleBid = async () => {
    if (!numPrice) return;
    setLoading(true);
    await placeBid(job.id, numPrice);
    setLoading(false);
    router.replace(`/(driver)/match/${job.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Place bid</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.jobSummary}>
          <Text style={styles.route}>{job.originAddress.split(',')[0]} → {job.destAddress.split(',')[0]}</Text>
          <Text style={styles.distance}>{job.distanceKm} km · {job.cargoDescription}</Text>
        </View>

        <View style={styles.priceInputArea}>
          <Text style={styles.priceLabel}>YOUR BID</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              autoFocus
            />
          </View>
          <Text style={styles.askingRef}>Asking price: ${job.askingPrice}</Text>
        </View>

        <View style={styles.earningsSection}>
          <Text style={styles.earningsTitle}>Your recent earnings</Text>
          <EarningsBar
            data={MOCK_EARNINGS.days.map((d) => ({ value: d.earned }))}
            average={MOCK_EARNINGS.averagePerJob}
            labels={MOCK_EARNINGS.days.map((d) => d.day)}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !numPrice && styles.btnDisabled]}
          onPress={handleBid}
          disabled={!numPrice || loading}
        >
          <Text style={styles.btnText}>{loading ? 'Placing bid…' : `Bid $${numPrice}`}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.section },
    jobSummary: { gap: 4 },
    route: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    distance: { fontSize: Typography.sizes.label, color: C.text.secondary },
    priceInputArea: { gap: 8 },
    priceLabel: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    currency: { fontSize: Typography.sizes.heroPrice, fontWeight: Typography.weights.light, color: C.text.secondary },
    priceInput: {
      fontSize: Typography.sizes.heroPrice, fontWeight: Typography.weights.bold,
      color: C.text.primary, fontVariant: ['tabular-nums'], flex: 1, padding: 0,
    },
    askingRef: { fontSize: Typography.sizes.label, color: C.text.tertiary, fontVariant: ['tabular-nums'] },
    earningsSection: { gap: Spacing.gap },
    earningsTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.text.secondary, textTransform: 'uppercase', letterSpacing: 1 },
    footer: { padding: Spacing.screenH },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
