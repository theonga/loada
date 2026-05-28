import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import * as ImagePicker from 'expo-image-picker';
import { getMySubscription, getPresignedUrl, confirmUpload, updateDriverProfile } from '@services';

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

type DocItem = {
  key: 'licence' | 'registration' | 'photo';
  title: string;
  desc: string;
  purpose: 'document' | 'truck';
  profileField: 'licenceUrl' | 'registrationUrl' | 'truckPhotoUrl';
};

const DOCS: DocItem[] = [
  { key: 'licence',      title: "Driver's licence",    desc: 'Front and back — must be valid',        purpose: 'document', profileField: 'licenceUrl' },
  { key: 'registration', title: 'Truck registration',  desc: 'Vehicle registration certificate',      purpose: 'document', profileField: 'registrationUrl' },
  { key: 'photo',        title: 'Truck photo',         desc: 'Clear photo of the full vehicle',       purpose: 'truck',    profileField: 'truckPhotoUrl' },
];

export default function DriverDocumentsScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const [statuses, setStatuses] = useState<Record<string, UploadStatus>>({
    licence: 'idle', registration: 'idle', photo: 'idle',
  });
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => {
    getMySubscription()
      .then((sub) => {
        if (sub?.status === 'ACTIVE' || sub?.status === 'TRIAL') {
          setAlreadySubscribed(true);
        }
      })
      .catch(() => {});
  }, []);

  const allDone = DOCS.every((d) => statuses[d.key] === 'done');
  const canContinue = allDone || alreadySubscribed;

  async function handleUpload(doc: DocItem) {
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

    setStatuses((prev) => ({ ...prev, [doc.key]: 'uploading' }));
    try {
      const { presignedUrl, s3Key } = await getPresignedUrl(doc.purpose, mimeType);

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType },
        body: await fetch(asset.uri).then((r) => r.blob()),
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      const { url } = await confirmUpload(s3Key);
      await updateDriverProfile({ [doc.profileField]: url });

      setStatuses((prev) => ({ ...prev, [doc.key]: 'done' }));
    } catch (err) {
      setStatuses((prev) => ({ ...prev, [doc.key]: 'error' }));
      Alert.alert('Upload failed', (err as Error).message ?? 'Please try again.');
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

        {DOCS.map((doc) => {
          const st = statuses[doc.key];
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
                onPress={() => handleUpload(doc)}
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
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={() => {
            if (alreadySubscribed) {
              router.replace('/(driver)');
            } else {
              router.push('/(auth)/driver-setup/paywall');
            }
          }}
          disabled={!canContinue}
        >
          <Text style={styles.btnText}>
            {alreadySubscribed ? 'Go to Loada' : 'Continue to subscription'}
          </Text>
        </Pressable>
        {!alreadySubscribed && (
          <Pressable onPress={() => router.push('/(auth)/driver-setup/paywall')}>
            <Text style={styles.skip}>Skip for now — upload after subscribing</Text>
          </Pressable>
        )}
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
