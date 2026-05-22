import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { ImgBox } from '@components/ui/ImgBox';

export default function DriverDocumentsScreen() {
  const router = useRouter();
  const [uploaded, setUploaded] = useState({ licence: false, registration: false, photo: false });
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const toggle = (key: keyof typeof uploaded) =>
    setUploaded((prev) => ({ ...prev, [key]: !prev[key] }));

  const allUploaded = uploaded.licence && uploaded.registration && uploaded.photo;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>3 / 4</Text>
        <View style={{ width: 44 }} />
      </View>
      <ProgressBar pct={75} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Your documents</Text>
        <Text style={styles.sub}>We verify these before you can start earning</Text>

        {[
          { key: 'licence' as const, title: "Driver's licence", desc: 'Front and back — must be valid' },
          { key: 'registration' as const, title: 'Truck registration', desc: 'Vehicle registration certificate' },
          { key: 'photo' as const, title: 'Truck photo', desc: 'Clear photo of the full vehicle' },
        ].map(({ key, title, desc }) => (
          <Pressable
            key={key}
            style={[styles.docCard, uploaded[key] && styles.docCardUploaded]}
            onPress={() => toggle(key)}
          >
            <View style={styles.docLeft}>
              <ImgBox width={60} height={44} borderRadius={8} label={title} />
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{title}</Text>
                <Text style={styles.docDesc}>{desc}</Text>
              </View>
            </View>
            <View style={[styles.uploadBtn, uploaded[key] && styles.uploadBtnDone]}>
              <Ionicons
                name={uploaded[key] ? 'checkmark' : 'cloud-upload-outline'}
                size={18}
                color={uploaded[key] ? C.status.green : C.text.secondary}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !allUploaded && styles.btnDisabled]}
          onPress={() => router.push('/(auth)/driver-setup/paywall')}
        >
          <Text style={styles.btnText}>Continue to subscription</Text>
        </Pressable>
        <Text style={styles.skip}>Documents under review? You can skip for now.</Text>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screenH },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    step: { fontSize: Typography.sizes.label, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.gap },
    heading: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary },
    docCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    docCardUploaded: { borderColor: C.status.green },
    docLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.gap, flex: 1 },
    docInfo: { gap: 4, flex: 1 },
    docTitle: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    docDesc: { fontSize: Typography.sizes.label, color: C.text.secondary },
    uploadBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.background.elevated, alignItems: 'center', justifyContent: 'center' },
    uploadBtnDone: { backgroundColor: C.status.green + '22' },
    footer: { padding: Spacing.screenH, gap: Spacing.gapSm },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    skip: { textAlign: 'center', fontSize: Typography.sizes.label, color: C.text.tertiary },
  });
}
