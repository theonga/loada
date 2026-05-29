import React, { useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';

const WHATSAPP_NUMBER = '+263773057669';
const SUPPORT_EMAIL = 'help@loada.app';

const FAQ = [
  { q: 'How does bidding work?', a: 'Post your load, set an asking price. Drivers within 25km will see it and can bid. You accept the best bid.' },
  { q: 'How does Loada charge drivers?', a: 'Loada takes a small % commission from each completed job — no monthly fees. Top up your wallet with as little as $10 to start bidding.' },
  { q: 'What if my driver doesn\'t arrive?', a: 'Contact your driver via in-app chat first. If unresolved, use the "Report issue" button on your active job.' },
  { q: 'How do I get my documents verified?', a: 'Upload clear photos of your documents in the Documents section. Verification takes 1–2 business days.' },
  { q: 'Can I cancel a job after matching?', a: 'You can cancel before the driver arrives at pickup. Cancellations after pickup may affect your rating.' },
];

export default function HelpScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Help & support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.contactCard}
          onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`)}
        >
          <Ionicons name="logo-whatsapp" size={28} color={C.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>WhatsApp support</Text>
            <Text style={styles.contactSub}>{WHATSAPP_NUMBER}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.text.tertiary} />
        </Pressable>

        <Pressable
          style={styles.contactCard}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        >
          <Ionicons name="mail-outline" size={28} color={C.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Email support</Text>
            <Text style={styles.contactSub}>{SUPPORT_EMAIL}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.text.tertiary} />
        </Pressable>

        <Text style={styles.faqTitle}>Frequently asked questions</Text>

        {FAQ.map(({ q, a }) => (
          <View key={q} style={styles.faqCard}>
            <Text style={styles.faqQ}>{q}</Text>
            <Text style={styles.faqA}>{a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    content: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: Spacing.section },
    contactCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, flexDirection: 'row', alignItems: 'center', gap: Spacing.gap, minHeight: Components.touchMin },
    contactTitle: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    contactSub: { fontSize: Typography.sizes.label, color: C.text.secondary },
    faqTitle: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    faqCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gapSm },
    faqQ: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    faqA: { fontSize: Typography.sizes.label, color: C.text.secondary, lineHeight: 20 },
  });
}
