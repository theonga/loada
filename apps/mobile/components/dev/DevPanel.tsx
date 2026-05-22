import React, { useState, useMemo } from 'react';
import { View, Pressable, Modal, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors, ColorPalette, Typography, Spacing, Radius } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import { useJobStore } from '@store/job.store';
import { MOCK_SHIPPER, MOCK_DRIVER, MOCK_JOBS } from '@services/mock/data';
import { JobStatus } from '@constants/index';
import { setPendingRole } from '@services/mock';

if (!__DEV__) {
  // This component only renders in dev mode — export null-safe version
}

const JOB_STATUSES: JobStatus[] = [
  JobStatus.BIDDING,
  JobStatus.MATCHED,
  JobStatus.IN_TRANSIT,
  JobStatus.DELIVERED,
  JobStatus.POSTED,
];

export function DevPanel() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, setUser, setRole, role } = useAuthStore();
  const { setActiveJob, activeJob } = useJobStore();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  if (!__DEV__) return null;

  const switchToShipper = () => {
    setUser(MOCK_SHIPPER);
    setRole('shipper');
    setPendingRole('shipper');
    setOpen(false);
    router.replace('/(shipper)');
  };

  const switchToDriver = () => {
    setUser(MOCK_DRIVER);
    setRole('driver');
    setPendingRole('driver');
    setOpen(false);
    router.replace('/(driver)');
  };

  const setJobStatus = (status: JobStatus) => {
    const job = MOCK_JOBS[0];
    setActiveJob({ ...job, status });
  };

  return (
    <>
      <Pressable style={styles.pill} onPress={() => setOpen(true)}>
        <Ionicons name="settings-outline" size={12} color={C.text.secondary} />
        <Text style={styles.pillText}>DEV</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>LOADA DEV MODE</Text>

          <Text style={styles.label}>Current user</Text>
          <Text style={styles.userInfo}>
            {user?.name ?? 'None'} ({role ?? 'none'})
          </Text>

          <View style={styles.switchRow}>
            <Pressable
              style={[styles.switchBtn, role === 'shipper' && styles.switchBtnActive]}
              onPress={switchToShipper}
            >
              <Text style={[styles.switchBtnText, role === 'shipper' && styles.switchBtnTextActive]}>
                Shipper
              </Text>
            </Pressable>
            <Pressable
              style={[styles.switchBtn, role === 'driver' && styles.switchBtnActive]}
              onPress={switchToDriver}
            >
              <Text style={[styles.switchBtnText, role === 'driver' && styles.switchBtnTextActive]}>
                Driver
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Active job status</Text>
          <View style={styles.statusRow}>
            {JOB_STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[styles.statusChip, activeJob?.status === s && styles.statusChipActive]}
                onPress={() => setJobStatus(s)}
              >
                <Text style={[styles.statusChipText, activeJob?.status === s && styles.statusChipTextActive]}>
                  {s.replace(/_/g, ' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    pill: {
      position: 'absolute',
      bottom: 90,
      right: 16,
      backgroundColor: 'rgba(10,10,10,0.85)',
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: C.background.divider,
      paddingHorizontal: 10,
      paddingVertical: 6,
      zIndex: 9999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    pillText: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
      fontWeight: Typography.weights.medium,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: C.background.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: Spacing.screenH,
      gap: Spacing.gap,
      borderTopWidth: 1,
      borderColor: C.background.divider,
    },
    sheetTitle: {
      fontSize: Typography.sizes.label,
      fontWeight: Typography.weights.bold,
      color: C.accent,
      letterSpacing: 1.2,
      textAlign: 'center',
    },
    label: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: Typography.weights.semibold,
      color: C.text.secondary,
      letterSpacing: 1.2,
    },
    userInfo: {
      fontSize: Typography.sizes.body,
      color: C.text.primary,
    },
    switchRow: {
      flexDirection: 'row',
      gap: Spacing.gapSm,
    },
    switchBtn: {
      flex: 1,
      height: 44,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    switchBtnActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },
    switchBtnText: {
      fontSize: Typography.sizes.body,
      color: C.text.secondary,
      fontWeight: Typography.weights.medium,
    },
    switchBtnTextActive: {
      color: C.background.primary,
    },
    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    statusChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radius.chip,
      borderWidth: 1,
      borderColor: C.background.divider,
      backgroundColor: C.background.elevated,
    },
    statusChipActive: {
      borderColor: C.accent,
      backgroundColor: 'rgba(245,166,35,0.12)',
    },
    statusChipText: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
    },
    statusChipTextActive: {
      color: C.accent,
    },
    closeBtn: {
      height: 48,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeBtnText: {
      fontSize: Typography.sizes.body,
      color: C.text.primary,
    },
  });
}
