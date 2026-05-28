import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Pressable, ScrollView, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { BidCard } from '@components/ui/BidCard';
import { CountdownBar } from '@components/ui/CountdownBar';
import { Pill } from '@components/ui/Pill';
import { Skeleton } from '@components/ui/Skeleton';
import { ScreenError } from '@components/ui/ScreenError';
import { getJobById, getJobBids, acceptBid, rejectBid, cancelJob } from '@services';
import { isAuthError } from '@services/api';
import { showError, showConfirm } from '@components/ui/AppAlert';
import { useJobStore } from '@store/job.store';
import { useLiveBids } from '@hooks/useLiveBids';
import type { Job, Bid } from '@/types';

export default function BidInboxScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string }>();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;

  const [view, setView] = useState<'list' | 'terminal'>('list');
  const [job, setJob] = useState<Job | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [radiusExpanded, setRadiusExpanded] = useState(false);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [rejectingBidId, setRejectingBidId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const setActiveJob = useJobStore((s) => s.setActiveJob);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const load = useCallback(() => {
    if (!jobId) return;
    setLoading(true);
    setError('');
    Promise.all([getJobById(jobId), getJobBids(jobId)])
      .then(([j, b]) => { setJob(j); setBids(b); setLoading(false); })
      .catch((err) => { if (!isAuthError(err)) setError((err as Error).message ?? 'Failed to load'); setLoading(false); });
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  useLiveBids(
    jobId,
    (bid) => setBids((prev) => {
      if (prev.some((b) => b.id === bid.id)) return prev;
      return [bid, ...prev].sort((a, b) => a.offeredPrice - b.offeredPrice);
    }),
    (status) => {
      if (status === 'RADIUS_EXPANDED') setRadiusExpanded(true);
    },
  );

  const handleAccept = useCallback(async (bidId: string) => {
    setAcceptingBidId(bidId);
    setActionError('');
    try {
      const updatedJob = await acceptBid(bidId);
      setActiveJob(updatedJob);
      router.replace(`/(shipper)/match/${updatedJob.id}`);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Could not accept bid. Please try again.';
      setActionError(msg);
    } finally {
      setAcceptingBidId(null);
    }
  }, [setActiveJob, router]);

  const handleReject = useCallback(async (bidId: string) => {
    setRejectingBidId(bidId);
    setActionError('');
    try {
      await rejectBid(bidId);
      setBids((prev) => prev.filter((b) => b.id !== bidId));
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Could not reject bid. Please try again.';
      setActionError(msg);
    } finally {
      setRejectingBidId(null);
    }
  }, []);

  const confirmCancel = useCallback(() => {
    showConfirm({
      title: 'Cancel this job?',
      message: bids.length > 0
        ? `${bids.length} driver${bids.length > 1 ? 's have' : ' has'} already bid. They will be notified it's been cancelled.`
        : 'The listing will be removed. No drivers will be notified.',
      confirmLabel: 'Yes, cancel job',
      destructive: true,
      onConfirm: async () => {
        if (!jobId) return;
        setCancelling(true);
        try {
          await cancelJob(jobId);
          setActiveJob(null);
          router.back();
        } catch (err: unknown) {
          setCancelling(false);
          const msg = (err as { message?: string })?.message ?? 'Could not cancel the job.';
          showError(msg);
        }
      },
    });
  }, [jobId, bids.length, setActiveJob, router]);

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.appbar}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text.primary} />
          </Pressable>
        </View>
        <View style={{ padding: Spacing.screenH, gap: Spacing.gap }}>
          <Skeleton width="70%" height={24} borderRadius={6} />
          <Skeleton width="50%" height={16} borderRadius={4} />
          <Skeleton width="100%" height={6} borderRadius={3} />
          <Skeleton width="100%" height={110} borderRadius={12} />
          <Skeleton width="100%" height={110} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenError message={error} onRetry={load} onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  const expiresAt = job?.biddingExpiresAt
    ? new Date(job.biddingExpiresAt)
    : new Date(Date.now() + 5 * 60000);

  const originShort = job?.originAddress.split(',')[0] ?? '—';
  const destShort = job?.destAddress.split(',')[0] ?? '—';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Appbar */}
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text.primary} />
        </Pressable>

        <View style={styles.appbarMeta}>
          <Text style={styles.appbarRoute} numberOfLines={1}>
            {originShort} → {destShort}
          </Text>
          <Text style={styles.appbarSub}>
            {job?.requiredTonnes}t
            {job?.distanceKm ? ` • ${job.distanceKm} km` : ''}
            {job?.askingPrice ? ` • $${job.askingPrice}` : ''}
          </Text>
        </View>

        <Pressable
          style={styles.iconBtn}
          onPress={confirmCancel}
          disabled={cancelling}
        >
          {cancelling
            ? <ActivityIndicator size="small" color={C.status.red} />
            : <Ionicons name="ellipsis-horizontal" size={22} color={C.text.secondary} />
          }
        </Pressable>
      </View>

      {/* Countdown + bid count row */}
      <View style={styles.countdownSection}>
        <CountdownBar expiresAt={expiresAt} />
        <View style={styles.countdownFooter}>
          <Text style={styles.countdownLabel}>Bidding closes</Text>
          <View style={[styles.bidBadge, bids.length > 0 && { backgroundColor: 'rgba(245,166,35,0.12)', borderColor: 'rgba(245,166,35,0.25)' }]}>
            <Text style={[styles.bidBadgeText, bids.length > 0 && { color: C.accent }]}>
              {bids.length} {bids.length === 1 ? 'bid' : 'bids'}
            </Text>
          </View>
        </View>
      </View>

      {/* Radius expansion banner */}
      {radiusExpanded && (
        <View style={[styles.banner, { backgroundColor: 'rgba(255,179,0,0.08)', borderColor: 'rgba(255,179,0,0.20)' }]}>
          <Ionicons name="radio-outline" size={13} color={C.status.amber} />
          <Text style={[styles.bannerText, { color: C.status.amber }]}>Expanding search radius — reaching more drivers</Text>
        </View>
      )}

      {/* View toggle */}
      <View style={styles.toggleRow}>
        <Pill active={view === 'list'} onPress={() => setView('list')}>Bids</Pill>
        <Pill active={view === 'terminal'} onPress={() => setView('terminal')}>Terminal</Pill>
      </View>

      {/* Inline action error */}
      {actionError !== '' && (
        <View style={[styles.banner, { backgroundColor: 'rgba(244,67,54,0.08)', borderColor: 'rgba(244,67,54,0.20)', marginBottom: 4 }]}>
          <Ionicons name="alert-circle-outline" size={13} color={C.status.red} />
          <Text style={[styles.bannerText, { color: C.status.red }]}>{actionError}</Text>
          <Pressable onPress={() => setActionError('')} hitSlop={8}>
            <Ionicons name="close" size={14} color={C.status.red} />
          </Pressable>
        </View>
      )}

      {/* Content */}
      {view === 'list' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, bids.length === 0 && styles.scrollCentered]}
        >
          {bids.length === 0 ? (
            <WaitingState C={C} />
          ) : (
            bids.map((bid, i) => (
              <BidCard
                key={bid.id}
                bid={bid}
                isBestMatch={i === 0}
                onAccept={() => handleAccept(bid.id)}
                onReject={() => handleReject(bid.id)}
                acceptLoading={acceptingBidId === bid.id}
                rejectLoading={rejectingBidId === bid.id}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <TerminalView bids={bids} C={C} />
      )}

    </SafeAreaView>
  );
}

// ─── Waiting state ────────────────────────────────────────────────────────────

function WaitingState({ C }: { C: ReturnType<typeof useColors> }) {
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <View style={{
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: C.background.elevated,
        borderWidth: 1, borderColor: C.background.divider,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="time-outline" size={28} color={C.text.tertiary} />
      </View>
      <Text style={{ fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary }}>
        Waiting for drivers
      </Text>
      <Text style={{ fontSize: Typography.sizes.label, color: C.text.secondary, textAlign: 'center', maxWidth: 220, lineHeight: 20 }}>
        Nearby drivers are being notified. Bids usually arrive within a minute.
      </Text>
    </View>
  );
}

// ─── Terminal view ────────────────────────────────────────────────────────────

function TerminalView({ bids, C }: { bids: Bid[]; C: ReturnType<typeof useColors> }) {
  const prices = bids.map((b) => b.offeredPrice);
  const low = prices.length ? Math.min(...prices) : 0;
  const med = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const high = prices.length ? Math.max(...prices) : 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={{
        flexDirection: 'row', justifyContent: 'space-around',
        backgroundColor: C.background.elevated,
        paddingVertical: 14, marginHorizontal: Spacing.screenH,
        borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider,
      }}>
        {[
          { label: 'BIDS', value: String(bids.length), accent: false },
          { label: 'LOW', value: `$${low}`, accent: false },
          { label: 'MED', value: `$${med}`, accent: true },
          { label: 'HIGH', value: `$${high}`, accent: false },
        ].map(({ label, value, accent }) => (
          <View key={label} style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: Typography.sizes.micro, fontWeight: Typography.weights.semibold, color: C.text.tertiary, letterSpacing: 1 }}>
              {label}
            </Text>
            <Text style={{ fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: accent ? C.accent : C.text.primary, fontVariant: ['tabular-nums'] }}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={{ flex: 1, marginTop: Spacing.gap }} contentContainerStyle={{ paddingHorizontal: Spacing.screenH, paddingBottom: 40 }}>
        {bids.length === 0 ? (
          <Text style={{ textAlign: 'center', paddingVertical: 40, fontSize: Typography.sizes.body, color: C.text.tertiary }}>
            No bids yet
          </Text>
        ) : (
          bids.map((bid, i) => (
            <View key={bid.id} style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: C.background.divider,
              gap: 12,
            }}>
              <Text style={{ fontSize: Typography.sizes.chip, color: C.text.tertiary, fontVariant: ['tabular-nums'], width: 24 }}>
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text style={{ flex: 1, fontSize: Typography.sizes.body, color: C.text.primary }}>
                {bid.driver.name || 'Driver'}
              </Text>
              <Text style={{ fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: i === 0 ? C.accent : C.text.primary, fontVariant: ['tabular-nums'] }}>
                ${bid.offeredPrice}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },

    appbar: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.screenH - 4,
      paddingVertical: 8,
      gap: 4,
    },
    iconBtn: {
      width: 44, height: 44,
      alignItems: 'center', justifyContent: 'center',
      borderRadius: 22,
    },
    appbarMeta: { flex: 1, paddingHorizontal: 4 },
    appbarRoute: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    appbarSub: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
      marginTop: 2,
      fontVariant: ['tabular-nums'],
    },

    countdownSection: {
      paddingHorizontal: Spacing.screenH,
      paddingBottom: 8,
      gap: 6,
    },
    countdownFooter: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    countdownLabel: {
      fontSize: Typography.sizes.chip, color: C.text.tertiary,
    },
    bidBadge: {
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: Radius.pill,
      backgroundColor: C.background.elevated,
      borderWidth: 1, borderColor: C.background.divider,
    },
    bidBadgeText: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.semibold,
      color: C.text.secondary,
      fontVariant: ['tabular-nums'],
    },

    banner: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginHorizontal: Spacing.screenH, marginBottom: 4,
      paddingHorizontal: 10, paddingVertical: 7,
      borderRadius: Radius.chip, borderWidth: 1,
    },
    bannerText: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.medium,
      flex: 1,
    },

    toggleRow: {
      flexDirection: 'row', gap: Spacing.gapSm,
      paddingHorizontal: Spacing.screenH,
      paddingTop: 4, paddingBottom: 12,
    },

    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: 40 },
    scrollCentered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });
}
