import React, { useMemo, useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';

const WHATSAPP_NUMBER = '+263773057669';
const SUPPORT_EMAIL = 'help@loada.app';

interface FaqItem { q: string; a: string }
interface FaqGroup { heading: string; items: FaqItem[] }

const FAQ_GROUPS: FaqGroup[] = [
  {
    heading: 'Getting started',
    items: [
      { q: 'How do I sign up?', a: 'Enter your phone number, verify the OTP, then pick Shipper or Driver. Drivers also need to upload their licence, registration and a truck photo.' },
      { q: "I'm not receiving the OTP code", a: 'SMS delivery can take up to 60 seconds on slower networks. Check your signal, then tap Resend after a minute. If it still doesn\'t arrive, switch to a stronger signal area and try again.' },
      { q: 'How long does document verification take?', a: 'Usually 1–2 business days. You\'ll get a push notification the moment your documents are approved or if anything needs to be re-uploaded.' },
      { q: 'My documents were rejected — why?', a: 'Most common reasons: blurry photo, expired licence, registration in a different name to your profile, or details that don\'t match the truck photo. Re-upload a clearer copy and we\'ll review again.' },
    ],
  },
  {
    heading: 'For shippers — posting loads',
    items: [
      { q: 'How do I post a load?', a: 'Tap the + button, enter pickup and drop-off, describe the cargo, pick the tonnage and truck type, then set your asking price. Drivers within 25km will start bidding.' },
      { q: 'No drivers are bidding on my load', a: 'We expand the search radius automatically every 60 seconds, up to 70km. If you still have no bids after a few rounds, try raising the price — the in-app market reference shows what similar loads usually pay.' },
      { q: 'Which tonnage should I pick?', a: 'Round up to the next tier: 1, 2, 5, 10, 20 or 30 tonnes. Under-declaring is the most common cause of pickup refusals — drivers can decline cargo that\'s heavier than their truck handles.' },
      { q: 'How long is bidding open?', a: 'Bidding stays open until you accept a bid or the TTL expires (5 minutes by default). After that the load shows as Expired and you can re-post.' },
      { q: 'Can I edit my load after posting it?', a: 'Not while bidding is live. Cancel the load and re-post with corrected details — the re-post screen pre-fills everything for you.' },
      { q: 'Can I have more than one active load at a time?', a: 'Not yet — one active job at a time per shipper. Complete the current one or cancel before posting another. If you try, the app will offer to take you straight to your active job.' },
    ],
  },
  {
    heading: 'For drivers — bidding & wallet',
    items: [
      { q: 'How does Loada charge me?', a: 'Pay-per-use, no subscription. When you place a bid we reserve a small commission (a % of your bid) from your wallet. We only charge it when the job completes. Rejected and expired bids are refunded automatically.' },
      { q: 'How do I top up my wallet?', a: 'Profile → Wallet → Top up. Pay via EcoCash, OneMoney or card through Paynow. EcoCash sends a push to your phone — confirm the prompt to credit your balance.' },
      { q: 'My Paynow payment succeeded but my balance hasn\'t updated', a: 'Pull down on the wallet screen to refresh. If it still hasn\'t credited within 5 minutes, send us your Paynow reference number and we\'ll trace it.' },
      { q: 'Why can\'t I place a bid?', a: 'Most common reasons: documents not yet approved, wallet balance too low to cover the commission reservation, you already have 3 active bids, or your truck\'s tonnage is below what the load requires.' },
      { q: 'Why was my bid rejected?', a: 'The shipper accepted someone else, the bidding window expired, or your counter was higher than the shipper\'s ceiling. Your reserved commission has been refunded — try the next load.' },
      { q: 'Can I bid on multiple loads at once?', a: 'Up to 3 pending bids at a time, and only when you don\'t already have an active job. If you try to bid while a job is in progress, the app will take you to complete it first.' },
    ],
  },
  {
    heading: 'During the job',
    items: [
      { q: 'I can\'t tap "Arrived at pickup" or "Mark delivered"', a: 'You need to be within 500m of the pickup or drop-off, with a recent GPS fix. Open the app outdoors for a few seconds to refresh location, then try again.' },
      { q: 'I\'m getting "GPS unavailable" or "Too far from waypoint"', a: 'Your last GPS reading is stale (older than 30 minutes) or outside the allowed range. Keep the app open and walk around briefly to refresh, then retry.' },
      { q: 'The other party isn\'t responding in chat', a: 'Try the chat first, then the call button. If unresolved, tap Report issue on the active job and our team will step in.' },
      { q: 'I forgot to mark the job delivered', a: 'Mark it as soon as you remember. If a job stays In transit for more than 7 days we auto-complete it and still deduct the commission — don\'t wait, it costs you the same.' },
      { q: 'How do I send a delivery proof photo?', a: 'Active job → Confirm delivery. Take a clear photo of the cargo at the drop-off and capture the recipient name and signature.' },
      { q: 'Why are my messages flagged or warned about?', a: 'Sharing phone numbers, WhatsApp handles, or "settle outside the app" wording is flagged for safety. You can still send them, but if a dispute happens we may not be able to back you up if the trip went off-platform.' },
    ],
  },
  {
    heading: 'After delivery — payment, ratings & disputes',
    items: [
      { q: 'When does the driver get paid?', a: 'Shippers pay drivers directly using the agreed method (cash, EcoCash, bank). Loada only ever charges its commission from the driver\'s wallet — it doesn\'t handle the load payment itself.' },
      { q: 'How do I rate the other party?', a: 'A rating screen appears automatically after delivery. Both sides see each other\'s star average and tags (On time, Careful with cargo, Professional, Good communication).' },
      { q: 'I forgot to rate', a: 'The job auto-completes after 72 hours, but you can still leave a rating from your job history before that.' },
      { q: 'The cargo arrived damaged or short', a: 'Tap Report issue or Dispute on the completed job. Include photos. We\'ll mediate with the other party — having everything on-platform makes this much easier.' },
    ],
  },
  {
    heading: 'Cancellations & refunds',
    items: [
      { q: 'How do I cancel a job?', a: 'Shippers: open the job and tap Cancel. Drivers: from your active job. The rules depend on status — cancelling before pickup is straightforward; after pickup is restricted.' },
      { q: 'Can I cancel after the driver arrives at pickup?', a: 'Shippers cannot self-cancel once the status reaches "Arrived at pickup" or later. If something has gone wrong, open a dispute and our team will review.' },
      { q: 'Will I get a commission refund?', a: 'Yes for pre-pickup cancellations and for rejected or expired bids — the reservation is released back to your wallet automatically. Post-pickup cancellations don\'t refund (the driver did the work).' },
    ],
  },
  {
    heading: 'Account & safety',
    items: [
      { q: 'Why was my account suspended?', a: 'Repeated last-minute cancellations, very low ratings, expired documents, or breaches of our safety rules. Email support and we\'ll review the case.' },
      { q: 'How do I update my truck or profile details?', a: 'Profile tab → edit the relevant section. Changes to truck registration, capacity or licence trigger a quick re-verification.' },
      { q: 'I lost my phone or changed numbers', a: 'Contact support straight away with proof of identity so we can recover your account. Do not let anyone else sign up using your old number.' },
      { q: 'Is it safe to give the driver/shipper my personal number?', a: 'We give you in-app chat and calling so you don\'t have to. Going off-platform means we can\'t help if a payment or pickup falls through.' },
    ],
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Help & support</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.section * 2 }]}>
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

        {FAQ_GROUPS.map((group) => (
          <View key={group.heading} style={styles.group}>
            <Text style={styles.groupHeading}>{group.heading}</Text>
            {group.items.map(({ q, a }) => {
              const key = `${group.heading}:${q}`;
              const open = !!expanded[key];
              return (
                <Pressable key={key} style={styles.faqCard} onPress={() => toggle(key)} hitSlop={4}>
                  <View style={styles.faqRow}>
                    <Text style={styles.faqQ}>{q}</Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.text.tertiary} />
                  </View>
                  {open && <Text style={styles.faqA}>{a}</Text>}
                </Pressable>
              );
            })}
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
    faqTitle: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2, marginTop: Spacing.gapSm },
    group: { gap: Spacing.gapSm, marginTop: Spacing.gapSm },
    groupHeading: { fontSize: Typography.sizes.bodySmall, fontWeight: Typography.weights.semibold, color: C.text.primary, marginBottom: 2 },
    faqCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gapSm, minHeight: Components.touchMin },
    faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.gap },
    faqQ: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary, flex: 1 },
    faqA: { fontSize: Typography.sizes.label, color: C.text.secondary, lineHeight: 20 },
  });
}
