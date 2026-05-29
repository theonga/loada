import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { getJobBids, getJobById } from '@services';
import { getSocket } from '@services/socket';
import { BidStatus } from '@constants/index';
import type { Job } from '@/types';

type PendingStatus = 'waiting' | 'accepted' | 'rejected' | 'countered' | 'expired';

export default function BidPendingScreen() {
  const router = useRouter();
  const { bidId, jobId } = useLocalSearchParams<{ bidId: string; jobId: string }>();
  const [status, setStatus] = useState<PendingStatus>('waiting');
  const [job, setJob] = useState<Job | null>(null);
  const [myBidPrice, setMyBidPrice] = useState<number | null>(null);
  const [counterPrice, setCounterPrice] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const poll = async () => {
    if (!bidId || !jobId) return;
    try {
      const [bids, j] = await Promise.all([getJobBids(jobId), getJobById(jobId)]);
      setJob(j);
      const myBid = bids.find((b) => b.id === bidId);
      if (!myBid) return;
      setMyBidPrice(myBid.offeredPrice);
      if (myBid.status === BidStatus.ACCEPTED) {
        clearInterval(intervalRef.current ?? undefined);
        setStatus('accepted');
        router.replace(`/(driver)/match/${jobId}`);
      } else if (myBid.status === BidStatus.REJECTED) {
        clearInterval(intervalRef.current ?? undefined);
        setStatus('rejected');
      } else if (myBid.status === BidStatus.COUNTERED) {
        clearInterval(intervalRef.current ?? undefined);
        setCounterPrice(j.askingPrice);
        setStatus('countered');
      } else if (myBid.status === BidStatus.EXPIRED || j.status === 'EXPIRED') {
        clearInterval(intervalRef.current ?? undefined);
        setStatus('expired');
      }
    } catch {
      // silent — don't disrupt polling on transient errors
    }
  };

  useEffect(() => {
    poll();
    // Polling stays as a safety net (push could be missed in background, etc.)
    // but with the socket subscription below, the typical case is instant.
    intervalRef.current = setInterval(poll, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [bidId, jobId]);

  // Socket: server emits to driver:${driverProfileId} on accept / reject / counter.
  // We don't need the driver profile id here — the socket auto-joins it on connect.
  useEffect(() => {
    if (!bidId || !jobId) return;
    const socket = getSocket('/jobs');
    if (!socket.connected) socket.connect();

    const handleMatched = (data: { bid?: { id: string; jobId: string } }) => {
      if (data?.bid?.jobId !== jobId) return;
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStatus('accepted');
      router.replace(`/(driver)/match/${jobId}`);
    };

    const handleBidUpdate = (data: { bid?: { id: string; status: string } }) => {
      if (!data?.bid || data.bid.id !== bidId) return;
      // Re-poll to get authoritative state (counter price, etc.)
      poll();
    };

    socket.on('job:matched', handleMatched);
    socket.on('job:bid_status_updated', handleBidUpdate);

    return () => {
      socket.off('job:matched', handleMatched);
      socket.off('job:bid_status_updated', handleBidUpdate);
    };
  }, [bidId, jobId]);

  const routeLabel = job
    ? `${job.originAddress.split(',')[0]} → ${job.destAddress.split(',')[0]}`
    : '—';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.appbar}>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/(driver)/loads/')}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.appbarTitle}>Bid sent</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {/* Route summary */}
        {job && (
          <View style={styles.jobCard}>
            <Text style={styles.routeText}>{routeLabel}</Text>
            <Text style={styles.cargoText}>{job.cargoDescription}</Text>
          </View>
        )}

        {/* Status area */}
        <View style={styles.statusArea}>
          {status === 'waiting' && (
            <>
              <View style={styles.waitingIconWrap}>
                <ActivityIndicator size="large" color={C.accent} />
              </View>
              <Text style={styles.statusHeading}>Waiting for shipper</Text>
              <Text style={styles.statusSub}>
                Your bid of{myBidPrice != null ? ` $${myBidPrice}` : ''} has been sent.{'\n'}
                You'll be notified as soon as the shipper responds.
              </Text>
            </>
          )}

          {status === 'accepted' && (
            <>
              <View style={[styles.waitingIconWrap, { backgroundColor: 'rgba(0,200,83,0.12)' }]}>
                <Ionicons name="checkmark-circle" size={48} color={C.status.green} />
              </View>
              <Text style={styles.statusHeading}>Bid accepted!</Text>
              <Text style={styles.statusSub}>Taking you to the match screen…</Text>
            </>
          )}

          {status === 'rejected' && (
            <>
              <View style={[styles.waitingIconWrap, { backgroundColor: 'rgba(244,67,54,0.10)' }]}>
                <Ionicons name="close-circle-outline" size={48} color={C.status.red} />
              </View>
              <Text style={styles.statusHeading}>Bid not selected</Text>
              <Text style={styles.statusSub}>
                The shipper went with another driver this time.{'\n'}
                Browse other loads to find your next job.
              </Text>
            </>
          )}

          {status === 'countered' && (
            <>
              <View style={[styles.waitingIconWrap, { backgroundColor: 'rgba(245,166,35,0.12)' }]}>
                <Ionicons name="swap-horizontal" size={48} color={C.accent} />
              </View>
              <Text style={styles.statusHeading}>Counter offer received</Text>
              <Text style={styles.statusSub}>
                The shipper has countered{counterPrice != null ? ` at $${counterPrice}` : ''}.{'\n'}
                Go to your bids to review and respond.
              </Text>
            </>
          )}

          {status === 'expired' && (
            <>
              <View style={[styles.waitingIconWrap, { backgroundColor: 'rgba(244,67,54,0.10)' }]}>
                <Ionicons name="time-outline" size={48} color={C.status.red} />
              </View>
              <Text style={styles.statusHeading}>Bidding closed</Text>
              <Text style={styles.statusSub}>
                This load's bidding window has ended.{'\n'}
                Browse available loads to find your next job.
              </Text>
            </>
          )}
        </View>

        <View style={styles.spacer} />

        {status === 'waiting' && (
          <View style={styles.tip}>
            <Ionicons name="information-circle-outline" size={16} color={C.text.tertiary} />
            <Text style={styles.tipText}>This page will update automatically when the shipper responds.</Text>
          </View>
        )}

        {(status === 'rejected' || status === 'expired') && (
          <Pressable style={styles.btn} onPress={() => router.replace('/(driver)/loads/')}>
            <Text style={styles.btnText}>Browse available loads</Text>
          </Pressable>
        )}

        {status === 'countered' && (
          <Pressable style={styles.btn} onPress={() => router.replace('/(driver)/loads/')}>
            <Text style={styles.btnText}>View counter offer</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenH,
      height: 56,
      borderBottomWidth: 1,
      borderBottomColor: C.background.divider,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    appbarTitle: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.section },
    jobCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      gap: 4,
      marginTop: Spacing.gap,
    },
    routeText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    cargoText: { fontSize: Typography.sizes.label, color: C.text.secondary },
    statusArea: { alignItems: 'center', gap: Spacing.gap, paddingTop: Spacing.section },
    waitingIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: 'rgba(245,166,35,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.gapSm,
    },
    statusHeading: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.text.primary, textAlign: 'center' },
    statusSub: { fontSize: Typography.sizes.body, color: C.text.secondary, textAlign: 'center', lineHeight: 22 },
    spacer: { flex: 1 },
    tip: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: Spacing.gap },
    tipText: { flex: 1, fontSize: Typography.sizes.label, color: C.text.tertiary, lineHeight: 18 },
    btn: {
      height: Components.buttonHeight,
      backgroundColor: C.accent,
      borderRadius: Radius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
