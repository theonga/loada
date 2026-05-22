import React, { useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Chip } from '@components/ui/Chip';
import { ImgBox } from '@components/ui/ImgBox';

const DOCS = [
  { id: 'licence', label: "Driver's licence", status: 'APPROVED', expiry: '2027-03-01' },
  { id: 'registration', label: 'Truck registration', status: 'APPROVED', expiry: '2026-08-15', warn: true },
  { id: 'photo', label: 'Truck photo', status: 'APPROVED', expiry: null },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Documents</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {DOCS.map((doc) => (
          <View key={doc.id} style={[styles.docCard, doc.warn && styles.docCardWarn]}>
            <ImgBox width={72} height={52} borderRadius={8} label={doc.label} />
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>{doc.label}</Text>
              {doc.expiry && (
                <View style={styles.docExpiryRow}>
                  {doc.warn && <Ionicons name="warning-outline" size={12} color={C.status.amber} />}
                  <Text style={[styles.docExpiry, doc.warn && { color: C.status.amber }]}>
                    {doc.warn ? 'Expires soon · ' : 'Expires '}{doc.expiry}
                  </Text>
                </View>
              )}
            </View>
            <Chip variant={doc.status === 'APPROVED' ? 'green' : 'amber'}>{doc.status}</Chip>
          </View>
        ))}

        <Pressable style={styles.uploadBtn}>
          <Ionicons name="cloud-upload-outline" size={20} color={C.accent} />
          <Text style={styles.uploadText}>Upload new document</Text>
        </Pressable>
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
    content: { padding: Spacing.screenH, gap: Spacing.gap },
    docCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, flexDirection: 'row', alignItems: 'center', gap: Spacing.gap },
    docCardWarn: { borderColor: C.status.amber },
    docInfo: { flex: 1, gap: 4 },
    docLabel: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    docExpiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    docExpiry: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    uploadBtn: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, borderStyle: 'dashed', padding: Spacing.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.gapSm, height: Components.buttonHeight },
    uploadText: { fontSize: Typography.sizes.body, color: C.accent, fontWeight: Typography.weights.medium },
  });
}
