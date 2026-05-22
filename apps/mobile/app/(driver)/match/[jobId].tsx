import React, { useEffect, useRef, useMemo } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { MOCK_JOBS, MOCK_SHIPPER } from '@services/mock/data';

export default function DriverMatchConfirmedScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const flash = useRef(new Animated.Value(0.8)).current;
  const job = MOCK_JOBS.find((j) => j.id === jobId) ?? MOCK_JOBS[0];
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    Animated.timing(flash, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.flashOverlay, { opacity: flash }]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Ionicons name="flash" size={14} color={C.accent} />
          <Text style={styles.badge}>MATCH CONFIRMED</Text>
        </View>
        <Text style={styles.heading}>You're on!</Text>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Shipper</Text>
            <Text style={styles.detailValue}>{MOCK_SHIPPER.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup</Text>
            <Text style={styles.detailValue}>{job.originAddress}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Destination</Text>
            <Text style={styles.detailValue}>{job.destAddress}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Agreed price</Text>
            <Text style={styles.priceValue}>${job.askingPrice}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{job.distanceKm} km</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <Pressable
          style={styles.btn}
          onPress={() => router.replace('/(driver)/active/en-route')}
        >
          <Text style={styles.btnText}>Navigate to pickup</Text>
        </Pressable>
        <Pressable
          style={styles.ghostBtn}
          onPress={() => router.push(`/(shared)/chat/${job.id}`)}
        >
          <Text style={styles.ghostBtnText}>Message shipper</Text>
        </Pressable>
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
    heading: { fontSize: Typography.sizes.heading, fontWeight: Typography.weights.bold, color: C.text.primary },
    detailCard: { width: '100%', backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, overflow: 'hidden' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.card },
    divider: { height: 1, backgroundColor: C.background.divider },
    detailLabel: { fontSize: Typography.sizes.body, color: C.text.secondary },
    detailValue: { fontSize: Typography.sizes.body, color: C.text.primary, fontWeight: Typography.weights.medium, flex: 1, textAlign: 'right' },
    priceValue: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'] },
    spacer: { flex: 1 },
    btn: { width: '100%', height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    ghostBtn: { width: '100%', height: Components.buttonHeight, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, alignItems: 'center', justifyContent: 'center' },
    ghostBtnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
  });
}
