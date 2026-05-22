import React, { useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ImgBox } from '@components/ui/ImgBox';
import { MOCK_JOBS, MOCK_DRIVERS } from '@services/mock/data';

export default function DeliveryPODScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const job = MOCK_JOBS.find((j) => j.id === jobId) ?? MOCK_JOBS[3];
  const driver = MOCK_DRIVERS[0];
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Proof of delivery</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.successBadge}>
          <Ionicons name="checkmark-circle" size={56} color={C.status.green} />
          <Text style={styles.deliveredText}>Delivered</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delivery photo</Text>
          <ImgBox width="100%" height={200} borderRadius={Radius.inner} label="delivery photo" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Delivered by</Text>
            <Text style={styles.detailValue}>{driver.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>Chiedza Mwangi</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Delivered at</Text>
            <Text style={styles.detailValue}>14:32 · {job.destAddress.split(',')[0]}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Job ID</Text>
            <Text style={styles.detailValue}>{job.id.toUpperCase()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.btn}
          onPress={() => router.push(`/(shipper)/rate/${job.id}`)}
        >
          <Text style={styles.btnText}>Rate your driver</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.gap },
    successBadge: { alignItems: 'center', gap: Spacing.gapSm, paddingVertical: 16 },
    deliveredText: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.status.green },
    card: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gap },
    sectionTitle: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    detail: { flexDirection: 'row', justifyContent: 'space-between' },
    divider: { height: 1, backgroundColor: C.background.divider },
    detailLabel: { fontSize: Typography.sizes.body, color: C.text.secondary },
    detailValue: { fontSize: Typography.sizes.body, color: C.text.primary, fontWeight: Typography.weights.medium },
    footer: { padding: Spacing.screenH },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
