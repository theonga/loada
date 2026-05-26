import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import { useJobStore } from '@store/job.store';
import { MapBg } from '@components/ui/MapBg';
import { MapPin } from '@components/ui/MapPin';
import { JobStatus } from '@constants/index';

export default function ShipperHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const activeJob = useJobStore((s) => s.activeJob);
  const firstName = user?.name.split(' ')[0] ?? 'there';
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const showActiveJob =
    activeJob != null &&
    [JobStatus.BIDDING, JobStatus.MATCHED, JobStatus.IN_TRANSIT, JobStatus.PICKUP_EN_ROUTE].includes(
      activeJob.status,
    );

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapBg>
          <View style={styles.pin1}><MapPin kind="me" /></View>
          <View style={styles.pin2}><MapPin kind="driver" scale={0.85} /></View>
          <View style={styles.pin3}><MapPin kind="driver" scale={0.85} /></View>
        </MapBg>
      </View>

      <SafeAreaView style={styles.overlay} edges={['top']}>
        {/* Appbar */}
        <View style={styles.appbar}>
          <View>
            <Text style={styles.greet}>Good morning</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <Pressable
            style={styles.bellBtn}
            onPress={() => router.push('/(shared)/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={C.text.primary} />
            <View style={styles.bellDot} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Bottom card area — absolute so tab bar safe area doesn't double-count */}
      <View style={styles.bottomArea}>
          {showActiveJob && activeJob && (
            <Pressable
              style={styles.activeJobChip}
              onPress={() => {
                if (activeJob.status === JobStatus.BIDDING || activeJob.status === JobStatus.POSTED) {
                  router.push(`/(shipper)/bids/${activeJob.id}`);
                } else {
                  router.push(`/(shipper)/tracking/${activeJob.id}`);
                }
              }}
            >
              <Text style={styles.chipRoute} numberOfLines={1}>
                {activeJob.originAddress.split(',')[0]} → {activeJob.destAddress.split(',')[0]}
              </Text>
              <Text style={styles.chipStatus}>{activeJob.status}</Text>
            </Pressable>
          )}

          {/* Where to card */}
          <View style={styles.promptCard}>
            <Pressable
              style={styles.whereToRow}
              onPress={() => router.push('/(shipper)/post/route')}
            >
              <View style={styles.plusBtn}>
                <Ionicons name="add" size={22} color={C.background.primary} />
              </View>
              <View style={styles.whereToText}>
                <Text style={styles.whereTo}>Where to?</Text>
                <Text style={styles.whereToSub}>Post a load — drivers bid in minutes</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.text.tertiary} />
            </Pressable>
          </View>
        </View>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    mapContainer: { position: 'absolute', inset: 0, flex: 1 } as never,
    pin1: { position: 'absolute', top: '40%', left: '35%' },
    pin2: { position: 'absolute', top: '30%', left: '60%' },
    pin3: { position: 'absolute', top: '55%', left: '25%' },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0 } as never,
    appbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.screenH,
      paddingVertical: 12,
      backgroundColor: 'rgba(10,10,10,0.7)',
    },
    greet: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    name: { fontSize: 16, fontWeight: Typography.weights.semibold, color: C.text.primary },
    bellBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.background.card,
      borderWidth: 1, borderColor: C.background.divider,
      alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    },
    bellDot: {
      position: 'absolute', top: 8, right: 9,
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: C.accent, borderWidth: 1.5, borderColor: C.background.card,
    },
    bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.screenH, gap: Spacing.gap } as never,
    activeJobsRow: { paddingBottom: 4, gap: Spacing.gapSm },
    activeJobChip: {
      backgroundColor: 'rgba(20,20,20,0.92)',
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    chipRoute: { fontSize: Typography.sizes.chip, color: C.text.primary, fontWeight: Typography.weights.medium },
    chipStatus: { fontSize: Typography.sizes.micro, color: C.text.tertiary, marginTop: 2 },
    promptCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      overflow: 'hidden',
    },
    whereToRow: {
      flexDirection: 'row', alignItems: 'center',
      padding: Spacing.card, gap: Spacing.gap,
      minHeight: Components.touchMin,
    },
    plusBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    whereToText: { flex: 1 },
    whereTo: { fontSize: 16, fontWeight: Typography.weights.semibold, color: C.text.primary },
    whereToSub: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2 },
  });
}
