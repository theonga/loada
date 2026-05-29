import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import * as ImagePicker from 'expo-image-picker';
import { getPresignedUrl, confirmUpload, updateDriverProfile } from '@services';
import { showAlert, showError } from '@components/ui/AppAlert';

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

type DocKey =
  | 'licenceFront'
  | 'licenceBack'
  | 'registration'
  | 'vehicleFront'
  | 'vehicleSide';

type DocItem = {
  key: DocKey;
  title: string;
  desc: string;
  purpose: 'document' | 'truck';
  profileField: string;
};

const DOCS: DocItem[] = [
  { key: 'licenceFront', title: "Driver's licence (front)", desc: 'Front side — must be valid and not expired', purpose: 'document', profileField: 'licenceUrl' },
  { key: 'licenceBack',  title: "Driver's licence (back)",  desc: 'Back side of your driver\'s licence',        purpose: 'document', profileField: 'licenceBackUrl' },
  { key: 'registration', title: 'Truck registration',       desc: 'Vehicle registration certificate',           purpose: 'document', profileField: 'registrationUrl' },
  { key: 'vehicleFront', title: 'Vehicle photo (front)',    desc: 'Clear front-facing photo of your truck',     purpose: 'truck',    profileField: 'truckPhotoUrl' },
  { key: 'vehicleSide',  title: 'Vehicle photo (side)',     desc: 'Full side view of your truck',               purpose: 'truck',    profileField: 'vehicleSidePhotoUrl' },
];

const INITIAL_STATUSES: Record<DocKey, UploadStatus> = {
  licenceFront: 'idle',
  licenceBack: 'idle',
  registration: 'idle',
  vehicleFront: 'idle',
  vehicleSide: 'idle',
};

export default function DriverDocumentsScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const [statuses, setStatuses] = useState<Record<DocKey, UploadStatus>>(INITIAL_STATUSES);

  const allDone = DOCS.every((d) => statuses[d.key] === 'done');

  async function handleUpload(doc: DocItem) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({ icon: 'camera-outline', title: 'Permission needed', message: 'Allow photo access to upload documents.', buttons: [{ label: 'OK', variant: 'accent' }] });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';

    setStatuses((prev) => ({ ...prev, [doc.key]: 'uploading' }));
    try {
      const { presignedUrl, s3Key } = await getPresignedUrl(doc.purpose, mimeType);

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: await fetch(asset.uri).then((r) => r.blob()),
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      // Persist the canonical S3 key, not the (1-hour) presigned URL.
      // Server-side response serializers refresh URLs on every read.
      const { s3Key: confirmedKey } = await confirmUpload(s3Key);
      await updateDriverProfile({ [doc.profileField]: confirmedKey });

      setStatuses((prev) => ({ ...prev, [doc.key]: 'done' }));
    } catch (err) {
      setStatuses((prev) => ({ ...prev, [doc.key]: 'error' }));
      showError((err as Error).message ?? 'Please try again.', 'Upload failed');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>2 / 3</Text>
        <View style={{ width: 44 }} />
      </View>
      <ProgressBar pct={66} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Your documents</Text>
        <Text style={styles.sub}>We verify these before you can start earning</Text>

        {/* Group: Identity */}
        <Text style={styles.groupLabel}>IDENTITY</Text>
        {DOCS.filter((d) => ['licenceFront', 'licenceBack', 'registration'].includes(d.key)).map((doc) =>
          renderDocCard(doc, statuses[doc.key], () => handleUpload(doc), C, styles)
        )}

        {/* Group: Vehicle */}
        <Text style={styles.groupLabel}>VEHICLE</Text>
        {DOCS.filter((d) => ['vehicleFront', 'vehicleSide'].includes(d.key)).map((doc) =>
          renderDocCard(doc, statuses[doc.key], () => handleUpload(doc), C, styles)
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !allDone && styles.btnDisabled]}
          onPress={() => router.push('/(auth)/driver-setup/deposit')}
          disabled={!allDone}
        >
          <Text style={styles.btnText}>Continue</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/driver-setup/deposit')}>
          <Text style={styles.skip}>Skip for now — upload after setup</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function renderDocCard(
  doc: DocItem,
  st: UploadStatus,
  onPress: () => void,
  C: ReturnType<typeof import('@constants/theme').useColors>,
  styles: ReturnType<typeof getStyles>,
) {
  const isUploading = st === 'uploading';
  const isDone = st === 'done';
  const isError = st === 'error';
  return (
    <View key={doc.key} style={[styles.docCard, isDone && styles.docCardDone, isError && styles.docCardError]}>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>{doc.title}</Text>
        <Text style={styles.docDesc}>{doc.desc}</Text>
      </View>
      <Pressable
        style={[styles.uploadBtn, isDone && styles.uploadBtnDone, isError && styles.uploadBtnError]}
        onPress={onPress}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color={C.accent} />
        ) : isDone ? (
          <Ionicons name="checkmark" size={18} color={C.status.green} />
        ) : isError ? (
          <Ionicons name="refresh" size={18} color={C.status.red} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={18} color={C.text.secondary} />
        )}
      </Pressable>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.screenH },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    step: { fontSize: Typography.sizes.label, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: 40 },
    heading: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary },
    groupLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: Typography.weights.semibold,
      color: C.text.tertiary,
      letterSpacing: 1.2,
      marginTop: Spacing.gapSm,
    },
    docCard: {
      backgroundColor: C.background.card, borderRadius: Radius.card,
      borderWidth: 1, borderColor: C.background.divider,
      padding: Spacing.card, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: Spacing.gap,
    },
    docCardDone: { borderColor: C.status.green },
    docCardError: { borderColor: C.status.red },
    docInfo: { flex: 1, gap: 4 },
    docTitle: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    docDesc: { fontSize: Typography.sizes.label, color: C.text.secondary },
    uploadBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.background.elevated,
      alignItems: 'center', justifyContent: 'center',
    },
    uploadBtnDone: { backgroundColor: C.status.green + '22' },
    uploadBtnError: { backgroundColor: C.status.red + '22' },
    footer: { padding: Spacing.screenH, gap: Spacing.gapSm },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    skip: { textAlign: 'center', fontSize: Typography.sizes.label, color: C.text.tertiary },
  });
}
