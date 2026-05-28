import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Avatar } from '@components/ui/Avatar';
import { Stars } from '@components/ui/Stars';
import { Skeleton } from '@components/ui/Skeleton';
import { ScreenError } from '@components/ui/ScreenError';
import { getJobById, getDriverProfile, getJobBids } from '@services';
import { isAuthError } from '@services/api';
import type { Job, DriverProfile, Bid } from '@/types';

export default function ShipperMatchConfirmedScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const flash = useRef(new Animated.Value(0.8)).current;
  const [job, setJob] = useState<Job | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [acceptedBid, setAcceptedBid] = useState<Bid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const load = () => {
    if (!jobId) return;
    setLoading(true);
    setError('');
    Promise.all([getJobById(jobId), getJobBids(jobId)])
      .then(([j, bids]) => {
        setJob(j);
        const matched = bids.find((b) => b.status === 'ACCEPTED');
        setAcceptedBid(matched ?? null);
        if (j.matchedDriverId) {
          return getDriverProfile(j.matchedDriverId).then(setDriver);
        }
      })
      .catch((err) => { if (!isAuthError(err)) setError((err as Error).message ?? 'Failed to load'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Animated.timing(flash, { toValue: 0, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { load(); }, [jobId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ padding: Spacing.screenH, gap: Spacing.gap, alignItems: 'center', marginTop: 48 }}>
          <Skeleton width={64} height={64} borderRadius={32} />
          <Skeleton width={160} height={20} borderRadius={4} />
          <Skeleton width="100%" height={120} borderRadius={12} />
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View
        style={[styles.flashOverlay, { opacity: flash }]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Ionicons name="flash" size={14} color={C.accent} />
          <Text style={styles.badge}>MATCH CONFIRMED</Text>
        </View>
        <Text style={styles.heading}>You've got a driver!</Text>

        <View style={styles.driverCard}>
          {driver ? (
            <>
              <Avatar name={driver.name} size={64} />
              <Text style={styles.driverName}>{driver.name}</Text>
              <Stars rating={driver.rating} count={driver.reviewCount} size={14} />
              <Text style={styles.truckInfo}>{driver.truckMake} {driver.truckModel} · {driver.capacityTonnes}t</Text>
            </>
          ) : (
            <>
              <Skeleton width={64} height={64} borderRadius={32} />
              <Skeleton width={120} height={18} borderRadius={4} />
            </>
          )}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agreed price</Text>
            <Text style={styles.detailPrice}>
              ${acceptedBid ? acceptedBid.offeredPrice : job?.askingPrice ?? '—'}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route</Text>
            <Text style={styles.detailValue}>
              {job ? `${job.originAddress.split(',')[0]} → ${job.destAddress.split(',')[0]}` : '—'}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ETA to pickup</Text>
            <Text style={styles.detailValue}>~12 min</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <Pressable
            style={styles.btnPrimary}
            onPress={() => job && router.replace(`/(shipper)/tracking/${job.id}`)}
          >
            <Text style={styles.btnPrimaryText}>Track driver</Text>
          </Pressable>
          <Pressable
            style={styles.btnGhost}
            onPress={() => job && router.push(`/(shared)/chat/${job.id}`)}
          >
            <Text style={styles.btnGhostText}>Message driver</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    flashOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.accent, zIndex: 10 },
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap, alignItems: 'center' },
    badgeRow: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 4 },
    badge: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.accent, letterSpacing: 1 },
    heading: { fontSize: Typography.sizes.heading, fontWeight: Typography.weights.bold, color: C.text.primary, textAlign: 'center', letterSpacing: -0.5 },
    driverCard: {
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider,
      padding: Spacing.section, alignItems: 'center', gap: Spacing.gapSm,
      width: '100%',
    },
    driverName: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    truckInfo: { fontSize: Typography.sizes.label, color: C.text.secondary },
    detailsCard: {
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider, width: '100%', overflow: 'hidden',
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.card },
    detailDivider: { height: 1, backgroundColor: C.background.divider },
    detailLabel: { fontSize: Typography.sizes.body, color: C.text.secondary },
    detailValue: { fontSize: Typography.sizes.body, color: C.text.primary, fontWeight: Typography.weights.medium },
    detailPrice: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'] },
    spacer: { flex: 1 },
    actions: { width: '100%', gap: Spacing.gap },
    btnPrimary: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnPrimaryText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    btnGhost: { height: Components.buttonHeight, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, alignItems: 'center', justifyContent: 'center' },
    btnGhostText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
  });
}
