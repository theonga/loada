import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { BidCard } from '@components/ui/BidCard';
import { CountdownBar } from '@components/ui/CountdownBar';
import { Pill } from '@components/ui/Pill';
import { MOCK_BIDS, MOCK_JOBS } from '@services/mock/data';

export default function BidInboxScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [view, setView] = useState<'list' | 'terminal'>('list');
  const job = MOCK_JOBS.find((j) => j.id === jobId) ?? MOCK_JOBS[0];
  const bids = MOCK_BIDS.filter((b) => b.jobId === job.id);
  const expiresAt = job.biddingExpiresAt ? new Date(job.biddingExpiresAt) : new Date(Date.now() + 5 * 60000);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleAccept = (bidId: string) => {
    router.push(`/(shipper)/match/${job.id}`);
  };

  const handleCounter = (bidId: string) => {
    router.push(`/(shared)/chat/${job.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <View style={styles.appbarCenter}>
          <Text style={styles.title} numberOfLines={1}>
            {job.originAddress.split(',')[0]} → {job.destAddress.split(',')[0]}
          </Text>
          <Text style={styles.bidCount}>{bids.length} bid{bids.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.appbarRight} />
      </View>

      <View style={styles.countdownRow}>
        <CountdownBar expiresAt={expiresAt} />
      </View>

      {/* View toggle */}
      <View style={styles.toggleRow}>
        <Pill active={view === 'list'} onPress={() => setView('list')}>Bids</Pill>
        <Pill active={view === 'terminal'} onPress={() => setView('terminal')}>Terminal</Pill>
      </View>

      {view === 'list' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {bids.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Waiting for bids…</Text>
            </View>
          ) : (
            bids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                isBestMatch={bid.isBestMatch}
                onAccept={() => handleAccept(bid.id)}
                onCounter={() => handleCounter(bid.id)}
                onSkip={() => {}}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <TerminalView bids={bids} job={job} />
      )}
    </SafeAreaView>
  );
}

function TerminalView({ bids, job }: { bids: ReturnType<typeof MOCK_BIDS.filter>; job: typeof MOCK_JOBS[0] }) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const prices = bids.map((b) => b.offeredPrice);
  const low = prices.length ? Math.min(...prices) : 0;
  const med = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const high = prices.length ? Math.max(...prices) : 0;

  return (
    <View style={styles.terminal}>
      <View style={styles.statsStrip}>
        {[
          { label: 'BIDS', value: String(bids.length) },
          { label: 'LOW', value: `$${low}` },
          { label: 'MED', value: `$${med}` },
          { label: 'HIGH', value: `$${high}` },
          { label: 'TTL', value: '3:12' },
        ].map(({ label, value }) => (
          <View key={label} style={styles.statItem}>
            <Text style={styles.statItemLabel}>{label}</Text>
            <Text style={styles.statItemValue}>{value}</Text>
          </View>
        ))}
      </View>
      <ScrollView style={styles.terminalLog} contentContainerStyle={styles.terminalLogContent}>
        {bids.map((bid, i) => (
          <View key={bid.id} style={styles.logRow}>
            <Text style={styles.logTime}>{String(i + 1).padStart(2, '0')}:00</Text>
            <Text style={styles.logName}>{bid.driver.name}</Text>
            <Text style={styles.logPrice}>${bid.offeredPrice}</Text>
            {bid.isBestMatch && (
              <View style={styles.logBestBadge}>
                <Ionicons name="star" size={10} color={C.accent} />
                <Text style={styles.logBest}>BEST</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    appbarCenter: { flex: 1, alignItems: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    bidCount: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    appbarRight: { minWidth: Components.touchMin },
    countdownRow: { paddingHorizontal: Spacing.screenH, paddingBottom: 4 },
    toggleRow: { flexDirection: 'row', gap: Spacing.gapSm, paddingHorizontal: Spacing.screenH, paddingVertical: 12 },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.gap },
    empty: { alignItems: 'center', paddingVertical: 48 },
    emptyText: { fontSize: Typography.sizes.body, color: C.text.tertiary },
    terminal: { flex: 1 },
    statsStrip: {
      flexDirection: 'row', justifyContent: 'space-around',
      backgroundColor: C.background.elevated,
      paddingVertical: 12, marginHorizontal: Spacing.screenH,
      borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider,
    },
    statItem: { alignItems: 'center', gap: 4 },
    statItemLabel: { fontSize: Typography.sizes.micro, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1 },
    statItemValue: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    terminalLog: { flex: 1, marginTop: Spacing.gap },
    terminalLogContent: { paddingHorizontal: Spacing.screenH, gap: 2 },
    logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.background.divider, gap: 12 },
    logTime: { fontSize: Typography.sizes.chip, color: C.text.tertiary, fontVariant: ['tabular-nums'], width: 36 },
    logName: { flex: 1, fontSize: Typography.sizes.body, color: C.text.primary },
    logPrice: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'] },
    logBestBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    logBest: { fontSize: Typography.sizes.eyebrow, color: C.accent, fontWeight: Typography.weights.semibold },
  });
}
