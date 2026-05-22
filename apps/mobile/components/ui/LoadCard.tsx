import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useColors, ColorPalette, Radius, Spacing, Typography, Components } from '@constants/theme';
import type { Job } from '@/types';
import { Chip } from './Chip';
import { TONNAGE_LABELS } from '@constants/index';

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

function bidCountLabel(count: number): string {
  if (count === 0) return 'no bids yet';
  if (count === 1) return '1 bid';
  return `${count} bids`;
}

interface LoadCardProps {
  job: Job;
  onPress: () => void;
}

export function LoadCard({ job, onPress }: LoadCardProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const isCompetitive = job.bidCount >= 2;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.routeCol}>
          <View style={styles.routeStop}>
            <Ionicons name="radio-button-on" size={10} color={C.status.green} />
            <Text style={styles.routeText} numberOfLines={1}>
              {job.originAddress.split(',')[0]}
            </Text>
          </View>
          <View style={styles.routeDivider}>
            <View style={[styles.routeLine, { backgroundColor: C.background.divider }]} />
          </View>
          <View style={styles.routeStop}>
            <Ionicons name="location" size={10} color={C.accent} />
            <Text style={styles.routeText} numberOfLines={1}>
              {job.destAddress.split(',')[0]}
            </Text>
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {job.distanceKm} km · {job.cargoDescription}
          </Text>
        </View>
        <Text style={styles.price}>${job.askingPrice}</Text>
      </View>

      <View style={styles.chips}>
        <Chip variant="amber">{TONNAGE_LABELS[job.requiredTonnes]}</Chip>
        {job.specialRequirements.map((req) => (
          <Chip key={req} variant={req === 'REFRIGERATED' ? 'blue' : 'default'}>
            {req}
          </Chip>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.bidCount, { color: isCompetitive ? C.accent : C.text.tertiary }]}>
          {bidCountLabel(job.bidCount)}
          {isCompetitive && ' · competitive'}
        </Text>
        <Text style={styles.timeAgo}>{timeAgo(job.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.cardSm,
      gap: Spacing.gapSm,
      minHeight: Components.touchMin,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: Spacing.gap,
    },
    routeCol: {
      flex: 1,
      gap: 3,
    },
    routeStop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    routeDivider: {
      paddingLeft: 4,
    },
    routeLine: {
      width: 1,
      height: 8,
      marginLeft: 1,
    },
    routeText: {
      fontSize: Typography.sizes.bodySmall,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
      flex: 1,
    },
    meta: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
      fontVariant: ['tabular-nums'],
      marginTop: 2,
    },
    price: {
      fontSize: 20,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      fontVariant: ['tabular-nums'],
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bidCount: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.medium,
      fontVariant: ['tabular-nums'],
    },
    timeAgo: {
      fontSize: Typography.sizes.chip,
      color: C.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
  });
}
