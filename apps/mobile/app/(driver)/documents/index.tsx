import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Chip } from '@components/ui/Chip';
import { Skeleton } from '@components/ui/Skeleton';
import * as ImagePicker from 'expo-image-picker';
import { getMyDriverProfile, updateDriverProfile, getPresignedUrl, confirmUpload } from '@services';
import type { DriverProfile } from '@/types';

type DocType = 'licence' | 'registration';

export default function DocumentsScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocType | null>(null);

  useEffect(() => {
    getMyDriverProfile()
      .then(setDriver)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function expiryWarning(isoDate?: string) {
    if (!isoDate) return false;
    return new Date(isoDate).getTime() - Date.now() < 60 * 86400000;
  }

  function formatExpiry(isoDate?: string) {
    if (!isoDate) return 'No expiry on file';
    return `Expires ${new Date(isoDate).toLocaleDateString()}`;
  }

  async function handleUpload(docType: DocType) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const purpose = 'document';

    setUploading(docType);
    try {
      const { presignedUrl, s3Key } = await getPresignedUrl(purpose, mimeType);

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: await fetch(asset.uri).then((r) => r.blob()),
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      const { url } = await confirmUpload(s3Key);

      const patch = docType === 'licence'
        ? { licenceUrl: url }
        : { registrationUrl: url };

      await updateDriverProfile(patch);
      const updated = await getMyDriverProfile();
      setDriver(updated);
    } catch (err) {
      Alert.alert('Upload failed', (err as Error).message ?? 'Please try again.');
    } finally {
      setUploading(null);
    }
  }

  const docs: { type: DocType; label: string; url?: string; expiry?: string }[] = [
    { type: 'licence', label: "Driver's licence", url: driver?.licenceUrl, expiry: driver?.licenceExpiry },
    { type: 'registration', label: 'Truck registration', url: driver?.registrationUrl, expiry: driver?.registrationExpiry },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Documents</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Overall status */}
        {!loading && driver && (
          <View style={styles.statusCard}>
            <Ionicons
              name={driver.documentStatus === 'APPROVED' ? 'checkmark-circle' : driver.documentStatus === 'REJECTED' ? 'close-circle' : 'time-outline'}
              size={20}
              color={driver.documentStatus === 'APPROVED' ? C.status.green : driver.documentStatus === 'REJECTED' ? C.status.red : C.status.amber}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Verification status</Text>
              <Text style={styles.statusSub}>
                {driver.documentStatus === 'APPROVED'
                  ? 'Your documents are verified. You can bid on loads.'
                  : driver.documentStatus === 'REJECTED'
                    ? 'Documents rejected. Please re-upload clear photos.'
                    : driver.documentStatus === 'UNDER_REVIEW'
                      ? 'Under review. Usually takes 1–2 business days.'
                      : 'Upload your documents to start bidding on loads.'}
              </Text>
            </View>
            <Chip variant={driver.documentStatus === 'APPROVED' ? 'green' : driver.documentStatus === 'REJECTED' ? 'red' : 'amber'}>
              {driver.documentStatus}
            </Chip>
          </View>
        )}

        {/* Document cards */}
        {loading ? (
          [1, 2].map((i) => <Skeleton key={i} width="100%" height={88} borderRadius={12} />)
        ) : (
          docs.map((doc) => {
            const warn = expiryWarning(doc.expiry);
            const isUploading = uploading === doc.type;
            return (
              <View key={doc.type} style={[styles.docCard, warn && { borderColor: C.status.amber }]}>
                <View style={styles.docIconBox}>
                  <Ionicons
                    name={doc.url ? 'document-text' : 'document-text-outline'}
                    size={24}
                    color={doc.url ? C.accent : C.text.tertiary}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docLabel}>{doc.label}</Text>
                  <View style={styles.docExpiryRow}>
                    {warn && <Ionicons name="warning-outline" size={12} color={C.status.amber} />}
                    <Text style={[styles.docExpiry, warn && { color: C.status.amber }]}>
                      {doc.url ? formatExpiry(doc.expiry) : 'Not uploaded'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.uploadChip, isUploading && { opacity: 0.6 }]}
                  onPress={() => handleUpload(doc.type)}
                  disabled={isUploading || uploading !== null}
                >
                  {isUploading
                    ? <ActivityIndicator size="small" color={C.accent} />
                    : <>
                        <Ionicons name={doc.url ? 'refresh' : 'cloud-upload-outline'} size={14} color={C.accent} />
                        <Text style={styles.uploadChipText}>{doc.url ? 'Replace' : 'Upload'}</Text>
                      </>
                  }
                </Pressable>
              </View>
            );
          })
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={C.text.tertiary} />
          <Text style={styles.infoText}>
            Upload clear, well-lit photos of your documents. Verification takes 1–2 business days.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    content: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: Spacing.section },

    statusCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    statusLabel: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.text.primary, marginBottom: 2 },
    statusSub: { fontSize: Typography.sizes.chip, color: C.text.secondary, lineHeight: 18 },

    docCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, flexDirection: 'row', alignItems: 'center', gap: Spacing.gap, minHeight: Components.touchMin },
    docIconBox: { width: 40, height: 40, borderRadius: Radius.inner, backgroundColor: C.background.elevated, alignItems: 'center', justifyContent: 'center' },
    docInfo: { flex: 1, gap: 3 },
    docLabel: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    docExpiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    docExpiry: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    uploadChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,166,35,0.10)', borderRadius: Radius.button, borderWidth: 1, borderColor: 'rgba(245,166,35,0.25)', paddingHorizontal: 10, paddingVertical: 6, minWidth: 72, justifyContent: 'center' },
    uploadChipText: { fontSize: Typography.sizes.chip, color: C.accent, fontWeight: Typography.weights.medium },

    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card },
    infoText: { flex: 1, fontSize: Typography.sizes.chip, color: C.text.secondary, lineHeight: 18 },
  } as const);
}
