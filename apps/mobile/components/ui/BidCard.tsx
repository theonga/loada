import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useColors, ColorPalette, Radius, Spacing, Typography, Components } from '@constants/theme';
import type { Bid } from '@/types';
import { Avatar } from './Avatar';
import { Stars } from './Stars';
import { Chip } from './Chip';
import { ImgBox } from './ImgBox';

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

interface BidCardProps {
  bid: Bid;
  isBestMatch?: boolean;
  onAccept: () => void;
  onReject: () => void;
  acceptLoading?: boolean;
  rejectLoading?: boolean;
}

export function BidCard({ bid, isBestMatch, onAccept, onReject, acceptLoading, rejectLoading }: BidCardProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const d = bid.driver;
  return (
    <View
      style={[
        styles.card,
        isBestMatch && styles.bestMatchCard,
      ]}
    >
      {isBestMatch && (
        <View style={styles.bestMatchBadge}>
          <View style={styles.bestMatchDot} />
          <Text style={styles.bestMatchText}>BEST MATCH</Text>
        </View>
      )}

      <View style={styles.header}>
        <Avatar name={d.name} size={44} />
        <View style={styles.headerInfo}>
          <Text style={styles.driverName} numberOfLines={1}>{d.name}</Text>
          <Stars rating={d.rating} count={d.reviewCount} size={12} />
          <Text style={styles.meta}>{d.yearsOnPlatform}yr on Loada</Text>
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.price}>${bid.offeredPrice}</Text>
          <Text style={styles.timeAgo}>{timeAgo(bid.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.truckRow}>
        <View style={styles.truckInfo}>
          <Text style={styles.truckModel}>
            {d.truckMake} {d.truckModel}
          </Text>
          <Chip variant="amber">{d.capacityTonnes}t capacity</Chip>
        </View>
        <ImgBox width={60} height={42} borderRadius={Radius.inner} label="truck" />
      </View>

      {/* Distance + ETA from driver's current location to pickup */}
      {(bid.distanceKm != null || bid.etaMinutes != null) && (
        <View style={styles.distRow}>
          {bid.distanceKm != null && (
            <View style={styles.distStat}>
              <Ionicons name="navigate-outline" size={12} color={C.text.tertiary} />
              <Text style={styles.distText}>{bid.distanceKm} km away</Text>
            </View>
          )}
          {bid.etaMinutes != null && (
            <View style={styles.distStat}>
              <Ionicons name="time-outline" size={12} color={C.text.tertiary} />
              <Text style={styles.distText}>ETA {bid.etaMinutes} min</Text>
            </View>
          )}
        </View>
      )}

      {bid.note && (
        <Text style={styles.note}>{bid.note}</Text>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.acceptBtn, (acceptLoading || rejectLoading) && { opacity: 0.7 }]}
          onPress={onAccept}
          disabled={acceptLoading || rejectLoading}
          hitSlop={8}
        >
          {acceptLoading
            ? <ActivityIndicator size="small" color="#0A0A0A" />
            : <Text style={styles.acceptText}>Accept</Text>
          }
        </Pressable>
        <Pressable
          style={[styles.btn, styles.rejectBtn, (acceptLoading || rejectLoading) && { opacity: 0.5 }]}
          onPress={onReject}
          disabled={acceptLoading || rejectLoading}
          hitSlop={8}
        >
          {rejectLoading
            ? <ActivityIndicator size="small" color="#F44336" />
            : <Text style={styles.rejectText}>Reject</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
      gap: Spacing.gap,
    },
    bestMatchCard: {
      borderColor: C.accent,
      backgroundColor: 'rgba(245,166,35,0.04)',
    },
    bestMatchBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bestMatchDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: C.accent,
    },
    bestMatchText: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: Typography.weights.semibold,
      color: C.accent,
      letterSpacing: 1.2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.gap,
    },
    headerInfo: {
      flex: 1,
      gap: 4,
    },
    driverName: {
      fontSize: Typography.sizes.bodySmall,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    meta: {
      fontSize: Typography.sizes.chip,
      color: C.text.tertiary,
    },
    priceCol: {
      alignItems: 'flex-end',
    },
    price: {
      fontSize: 22,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      fontVariant: ['tabular-nums'],
    },
    timeAgo: {
      fontSize: Typography.sizes.chip,
      color: C.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    truckRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    truckInfo: {
      gap: 6,
      flex: 1,
    },
    truckModel: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
    },
    distRow: {
      flexDirection: 'row',
      gap: Spacing.gap,
      backgroundColor: C.background.elevated,
      borderRadius: Radius.inner,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    distStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    distText: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
      fontVariant: ['tabular-nums'],
    },
    note: {
      fontSize: Typography.sizes.label,
      color: C.text.secondary,
      fontStyle: 'italic',
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.gapSm,
      marginTop: 4,
    },
    btn: {
      height: Components.touchMin,
      borderRadius: Radius.button,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    acceptBtn: {
      backgroundColor: C.status.green,
    },
    rejectBtn: {
      backgroundColor: 'rgba(244,67,54,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(244,67,54,0.25)',
    },
    acceptText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.background.primary,
    },
    rejectText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.status.red,
    },
  });
}
