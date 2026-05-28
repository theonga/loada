import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { JobStatus } from '@constants/index';
import { useColors, ColorPalette, Typography } from '@constants/theme';

interface StatusBadgeProps {
  status: JobStatus;
}

function getStatusMap(C: ColorPalette): Record<JobStatus, { color: string; label: string }> {
  return {
    [JobStatus.DRAFT]: { color: C.text.secondary, label: 'Draft' },
    [JobStatus.POSTED]: { color: C.status.amber, label: 'Waiting for bids' },
    [JobStatus.BIDDING]: { color: C.status.amber, label: 'Waiting for bids' },
    [JobStatus.RADIUS_EXPANDED]: { color: C.status.amber, label: 'Waiting for bids' },
    [JobStatus.MATCHED]: { color: C.accent, label: 'Driver on the way' },
    [JobStatus.PICKUP_EN_ROUTE]: { color: C.accent, label: 'Driver on the way' },
    [JobStatus.PICKUP_ARRIVED]: { color: C.accent, label: 'Driver on the way' },
    [JobStatus.LOADED]: { color: C.status.blue, label: 'In transit' },
    [JobStatus.IN_TRANSIT]: { color: C.status.blue, label: 'In transit' },
    [JobStatus.DELIVERED]: { color: C.status.green, label: 'Delivered' },
    [JobStatus.COMPLETED]: { color: C.status.green, label: 'Delivered' },
    [JobStatus.CANCELLED]: { color: C.status.red, label: 'Cancelled' },
    [JobStatus.DISPUTED]: { color: C.status.red, label: 'Disputed' },
    [JobStatus.EXPIRED]: { color: C.status.red, label: 'Expired' },
  };
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const C = useColors();
  const styles = useMemo(() => getStyles(), []);
  const statusMap = useMemo(() => getStatusMap(C), [C]);
  const { color, label } = statusMap[status];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

function getStyles() {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.medium,
    },
  });
}
