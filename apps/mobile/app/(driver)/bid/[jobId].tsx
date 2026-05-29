import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { EarningsBar } from '@components/ui/EarningsBar';
import { Skeleton } from '@components/ui/Skeleton';
import { getJobById, placeBid, getEarningsSummary, getMyDriverProfile, getWalletBalance } from '@services';
import { handleDriverActiveJobConflict } from '@services/activeJobConflict';
import { useAuthStore } from '@store/auth.store';
import { useWalletStore } from '@store/wallet.store';
import { useJobViewerPresence } from '@hooks/useJobViewerPresence';
import { showAlert } from '@components/ui/AppAlert';
import { JobStatus } from '@constants/index';
import type { Job, EarningsSummary, DriverProfile } from '@/types';

const BIDDABLE_STATUSES: Job['status'][] = [JobStatus.POSTED, JobStatus.BIDDING, JobStatus.RADIUS_EXPANDED];

function unavailableReason(job: Job): { title: string; sub: string; btn: string } | null {
  if (job.status === JobStatus.CANCELLED) {
    return { title: 'Load cancelled', sub: 'The shipper cancelled this load. It\'s no longer accepting bids.', btn: 'Load cancelled' };
  }
  if (job.status === JobStatus.EXPIRED) {
    return { title: 'Bidding closed', sub: 'The bidding window for this load has expired.', btn: 'Bidding closed' };
  }
  if (!BIDDABLE_STATUSES.includes(job.status)) {
    return { title: 'Already matched', sub: 'Another driver has been matched to this load.', btn: 'Not available' };
  }
  if (job.biddingExpiresAt && new Date(job.biddingExpiresAt) < new Date()) {
    return { title: 'Bidding closed', sub: 'The bidding window for this load has expired.', btn: 'Bidding closed' };
  }
  return null;
}

export default function PlaceBidScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const user = useAuthStore((s) => s.user);
  const { balance, commissionPct, setWallet } = useWalletStore();

  const [job, setJob] = useState<Job | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const numPrice = parseInt(price, 10) || 0;
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useJobViewerPresence(jobId);

  // Commission that will be reserved when bid is placed
  const commissionAmount = numPrice > 0 ? parseFloat((numPrice * commissionPct / 100).toFixed(2)) : 0;
  const hasEnoughBalance = balance >= commissionAmount;
  const docsApproved = driverProfile?.documentStatus === 'APPROVED';
  const unavailable = job ? unavailableReason(job) : null;
  const canBid = docsApproved && hasEnoughBalance && !unavailable;

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      getJobById(jobId),
      getEarningsSummary(user?.id ?? ''),
      getMyDriverProfile(),
      getWalletBalance(),
    ])
      .then(([j, e, p, w]) => {
        setJob(j);
        setEarnings(e);
        setDriverProfile(p);
        setWallet(w.balance, w.reservedBalance, w.commissionPct);
        setPrice(String(Math.round(j.askingPrice * 0.96)));
        setLoading(false);
      })
      .catch(() => { setError('Could not load job details.'); setLoading(false); });
  }, [jobId]);

  const blockReason = !docsApproved
    ? {
        icon: 'document-outline' as const,
        iconVariant: 'destructive' as const,
        title: 'Documents not approved',
        body: 'Your documents must be approved before you can place bids.',
        cta: 'Upload documents',
        action: () => router.push('/(driver)/documents'),
      }
    : {
        icon: 'wallet-outline' as const,
        iconVariant: 'accent' as const,
        title: 'Insufficient balance',
        body: `You need $${commissionAmount.toFixed(2)} in your wallet to place this bid. Your current balance is $${balance.toFixed(2)}.`,
        cta: 'Top up wallet',
        action: () => router.push('/(driver)/wallet'),
      };

  const handleBid = async () => {
    if (!numPrice || !job) return;
    if (!canBid) {
      showAlert({
        icon: blockReason.icon,
        iconVariant: blockReason.iconVariant,
        title: blockReason.title,
        message: blockReason.body,
        buttons: [
          { label: 'Later', variant: 'default' },
          { label: blockReason.cta, variant: blockReason.iconVariant === 'accent' ? 'accent' : 'destructive', onPress: blockReason.action },
        ],
      });
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const bid = await placeBid(job.id, numPrice);
      // Update local balance after successful bid (commission reserved)
      setWallet(balance - commissionAmount, 0, commissionPct);
      router.replace(`/(driver)/bid/pending/${bid.id}?jobId=${job.id}`);
    } catch (err) {
      const handled = await handleDriverActiveJobConflict(err);
      if (handled) {
        setSubmitting(false);
        return;
      }
      const apiErr = err as { message?: string; currentBalance?: number; requiredAmount?: number };
      if (apiErr.currentBalance !== undefined) {
        setWallet(apiErr.currentBalance, 0, commissionPct);
      }
      setError(apiErr.message ?? 'Could not place bid. Try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.appbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={C.text.primary} />
          </Pressable>
          <Text style={styles.title}>Place bid</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ padding: Spacing.screenH, gap: Spacing.gap }}>
          <Skeleton width="100%" height={80} borderRadius={12} />
          <Skeleton width="100%" height={160} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={{ color: C.text.secondary, textAlign: 'center', marginTop: 40 }}>
          {error || 'Job not found.'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Place bid</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Job summary */}
        <View style={styles.jobSummary}>
          <Text style={styles.route}>{job.originAddress.split(',')[0]} → {job.destAddress.split(',')[0]}</Text>
          <Text style={styles.jobMeta}>{job.cargoDescription} · {job.requiredTonnes}t</Text>
        </View>

        {/* Wallet balance widget — always visible */}
        <Pressable style={styles.walletCard} onPress={() => router.push('/(driver)/wallet')}>
          <View style={styles.walletLeft}>
            <Ionicons name="wallet-outline" size={18} color={C.accent} />
            <View>
              <Text style={styles.walletLabel}>Wallet balance</Text>
              <Text style={styles.walletBalance}>${balance.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.topUpBtn}>
            <Text style={styles.topUpText}>Top up</Text>
          </View>
        </Pressable>

        {/* Job no longer biddable banner */}
        {unavailable && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle-outline" size={16} color={C.status.red} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelledTitle}>{unavailable.title}</Text>
              <Text style={styles.insufficientSub}>{unavailable.sub}</Text>
            </View>
          </View>
        )}

        {/* Insufficient balance banner */}
        {!unavailable && numPrice > 0 && !hasEnoughBalance && (
          <Pressable style={styles.insufficientBanner} onPress={() => router.push('/(driver)/wallet')}>
            <Ionicons name="warning-outline" size={16} color={C.status.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.insufficientTitle}>Insufficient balance</Text>
              <Text style={styles.insufficientSub}>
                Need ${commissionAmount.toFixed(2)} · You have ${balance.toFixed(2)} · Top up wallet →
              </Text>
            </View>
          </Pressable>
        )}

        {/* Docs not approved banner */}
        {!docsApproved && (
          <Pressable style={styles.docsBanner} onPress={() => router.push('/(driver)/documents')}>
            <Ionicons name="document-outline" size={16} color={C.status.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.insufficientTitle}>Documents not approved</Text>
              <Text style={styles.insufficientSub}>Upload your documents to start bidding →</Text>
            </View>
          </Pressable>
        )}

        {/* Price input */}
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

        {/* Commission breakdown */}
        {numPrice > 0 && (
          <View style={styles.commissionCard}>
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabel}>You earn</Text>
              <Text style={styles.commissionEarn}>${numPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.commissionDivider} />
            <View style={styles.commissionRow}>
              <Text style={styles.commissionLabel}>Loada fee ({commissionPct}%)</Text>
              <Text style={styles.commissionFee}>-${commissionAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.commissionRow}>
              <Text style={[styles.commissionLabel, { color: C.text.primary }]}>Net to you</Text>
              <Text style={styles.commissionNet}>${(numPrice - commissionAmount).toFixed(2)}</Text>
            </View>
          </View>
        )}

        {earnings && earnings.days.length > 0 && (
          <View style={styles.earningsSection}>
            <Text style={styles.earningsTitle}>Your recent earnings</Text>
            <EarningsBar
              data={earnings.days.map((d) => ({ value: d.earned }))}
              average={earnings.averagePerJob}
              labels={earnings.days.map((d) => d.day)}
            />
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, (!numPrice || !canBid) && styles.btnDisabled]}
          onPress={handleBid}
          disabled={!numPrice || submitting || !!unavailable}
        >
          <Text style={styles.btnText}>
            {submitting
              ? 'Placing bid…'
              : unavailable
                ? unavailable.btn
                : !docsApproved
                  ? 'Documents required'
                  : !hasEnoughBalance
                    ? 'Insufficient balance'
                    : `Bid $${numPrice}`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenH, height: 56,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.section },
    jobSummary: { gap: 4 },
    route: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    jobMeta: { fontSize: Typography.sizes.label, color: C.text.secondary },
    walletCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card,
    },
    walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    walletLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    walletBalance: {
      fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold,
      color: C.text.primary, fontVariant: ['tabular-nums'],
    },
    topUpBtn: {
      backgroundColor: 'rgba(245,166,35,0.12)', borderRadius: Radius.button,
      paddingHorizontal: 12, paddingVertical: 6,
    },
    topUpText: { fontSize: Typography.sizes.chip, fontWeight: Typography.weights.semibold, color: C.accent },
    insufficientBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm,
      backgroundColor: 'rgba(255,179,0,0.08)', borderWidth: 1,
      borderColor: 'rgba(255,179,0,0.25)', borderRadius: Radius.button, padding: Spacing.card,
    },
    docsBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm,
      backgroundColor: 'rgba(255,179,0,0.08)', borderWidth: 1,
      borderColor: 'rgba(255,179,0,0.25)', borderRadius: Radius.button, padding: Spacing.card,
    },
    cancelledBanner: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.gapSm,
      backgroundColor: 'rgba(244,67,54,0.08)', borderWidth: 1,
      borderColor: 'rgba(244,67,54,0.25)', borderRadius: Radius.button, padding: Spacing.card,
    },
    cancelledTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.status.red },
    insufficientTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.status.amber },
    insufficientSub: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2, fontVariant: ['tabular-nums'] },
    priceInputArea: { gap: 8 },
    priceLabel: {
      fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold,
      color: C.text.secondary, letterSpacing: 1.2,
    },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    currency: { fontSize: Typography.sizes.heroPrice, fontWeight: Typography.weights.light, color: C.text.secondary },
    priceInput: {
      fontSize: Typography.sizes.heroPrice, fontWeight: Typography.weights.bold,
      color: C.text.primary, fontVariant: ['tabular-nums'], flex: 1, padding: 0,
    },
    askingRef: { fontSize: Typography.sizes.label, color: C.text.tertiary, fontVariant: ['tabular-nums'] },
    commissionCard: {
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: 10,
    },
    commissionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    commissionDivider: { height: 1, backgroundColor: C.background.divider },
    commissionLabel: { fontSize: Typography.sizes.label, color: C.text.secondary },
    commissionEarn: {
      fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold,
      color: C.text.primary, fontVariant: ['tabular-nums'],
    },
    commissionFee: {
      fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold,
      color: C.text.secondary, fontVariant: ['tabular-nums'],
    },
    commissionNet: {
      fontSize: Typography.sizes.body, fontWeight: Typography.weights.bold,
      color: C.status.green, fontVariant: ['tabular-nums'],
    },
    earningsSection: { gap: Spacing.gap },
    earningsTitle: {
      fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold,
      color: C.text.secondary, textTransform: 'uppercase', letterSpacing: 1,
    },
    errorText: { color: C.status.red, fontSize: Typography.sizes.label, textAlign: 'center' },
    footer: { padding: Spacing.screenH },
    btn: {
      height: Components.buttonHeight, backgroundColor: C.accent,
      borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
