import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Chip } from '@components/ui/Chip';
import { useDraftJobStore } from '@store/draftJob.store';
import { postJob } from '@services';

export default function PostConfirmScreen() {
  const router = useRouter();
  const complete = useDraftJobStore((s) => s.complete);
  const reset = useDraftJobStore((s) => s.reset);
  const draft = complete();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handlePost = async () => {
    if (!draft) return;
    setLoading(true);
    setError('');
    try {
      const job = await postJob({
        originAddress: draft.originAddress,
        originLat: draft.originLat,
        originLng: draft.originLng,
        destAddress: draft.destAddress,
        destLat: draft.destLat,
        destLng: draft.destLng,
        cargoDescription: draft.cargoDescription,
        requiredTonnes: draft.requiredTonnes,
        specialRequirements: draft.specialRequirements,
        askingPrice: draft.askingPrice,
        currency: draft.currency,
      });
      reset();
      router.replace(`/(shipper)/bids/${job.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to post load. Please try again.');
      setLoading(false);
    }
  };

  if (!draft) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenH }}>
          <Text style={{ color: C.text.secondary, textAlign: 'center' }}>
            Incomplete load details. Please go back and fill in all steps.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: C.accent }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>4 / 4</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.progress}>
        <ProgressBar pct={100} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Confirm your load</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>From</Text>
            <Text style={styles.rowValue}>{draft.originAddress}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>To</Text>
            <Text style={styles.rowValue}>{draft.destAddress}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Cargo</Text>
            <Text style={styles.rowValue}>{draft.cargoDescription}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tonnage</Text>
            <Chip variant="amber">{draft.requiredTonnes}t</Chip>
          </View>
          {draft.specialRequirements.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Special</Text>
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                  {draft.specialRequirements.map((r) => (
                    <Chip key={r} variant="default">{r}</Chip>
                  ))}
                </View>
              </View>
            </>
          )}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Asking price</Text>
            <Text style={styles.price}>${draft.askingPrice}</Text>
          </View>
        </View>

        {error ? (
          <Text style={{ color: C.status.red, fontSize: Typography.sizes.label, textAlign: 'center' }}>
            {error}
          </Text>
        ) : null}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="megaphone-outline" size={18} color={C.text.secondary} />
            <Text style={styles.infoText}>Your load will be broadcast to drivers within 25km. You'll start receiving bids within minutes.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.btn} onPress={handlePost} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Posting…' : 'Post load'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    step: { fontSize: Typography.sizes.label, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    progress: { paddingHorizontal: Spacing.screenH },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.gap },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    card: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, overflow: 'hidden' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.card },
    divider: { height: 1, backgroundColor: C.background.divider },
    rowLabel: { fontSize: Typography.sizes.body, color: C.text.secondary },
    rowValue: { fontSize: Typography.sizes.body, color: C.text.primary, fontWeight: Typography.weights.medium, flex: 1, textAlign: 'right' },
    price: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'] },
    infoCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.gapSm },
    infoText: { flex: 1, fontSize: Typography.sizes.body, color: C.text.secondary, lineHeight: 22 },
    footer: { padding: Spacing.screenH },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
