import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useJobStore } from '@store/job.store';
import { usePhotoUpload } from '@hooks/usePhotoUpload';
import { confirmPickup } from '@services';
import { useEnsureActiveJob } from '@hooks/useEnsureActiveJob';
import { useActiveJobRouteGuard } from '@hooks/useActiveJobRoute';
import { JobStatus } from '@constants/index';

export default function PickupScreen() {
  const router = useRouter();
  const job = useEnsureActiveJob();
  useActiveJobRouteGuard(job, '/(driver)/active/pickup');
  const setActiveJob = useJobStore((s) => s.setActiveJob);
  const { state: photoState, pickAndUpload } = usePhotoUpload('pickup');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const photoReady = photoState.status === 'done';
  const uploading = photoState.status === 'uploading';

  async function handleConfirm() {
    if (!job) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await confirmPickup(job.id, photoState.status === 'done' ? photoState.s3Key : undefined);
      // confirmPickup transitions PICKUP_ARRIVED → IN_TRANSIT server-side
      setActiveJob({ ...job, status: JobStatus.IN_TRANSIT });
      router.replace('/(driver)/active/in-transit');
    } catch {
      setSubmitError('Failed to confirm pickup. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Confirm cargo loaded</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Take a photo of the loaded cargo</Text>

        <Pressable
          style={styles.cameraArea}
          onPress={photoReady || uploading ? undefined : pickAndUpload}
          disabled={uploading || submitting}
        >
          {photoState.status === 'done' ? (
            <Image source={{ uri: photoState.previewUrl }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.cameraPlaceholder}>
              {uploading ? (
                <ActivityIndicator color={C.accent} size="large" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={48} color={C.text.tertiary} />
                  <Text style={styles.cameraHint}>Tap to take photo</Text>
                </>
              )}
            </View>
          )}
          {!photoReady && !uploading && (
            <>
              <View style={styles.cameraCornerTL} />
              <View style={styles.cameraCornerBR} />
            </>
          )}
        </Pressable>

        {photoState.status === 'error' && (
          <Text style={styles.errorText}>{photoState.message}</Text>
        )}

        {photoReady && (
          <View style={styles.confirmRow}>
            <Ionicons name="checkmark-circle" size={18} color={C.status.green} />
            <Text style={styles.confirmText}>Cargo photo taken</Text>
          </View>
        )}

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, submitting && styles.btnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={C.background.primary} />
          ) : (
            <Text style={styles.btnText}>Confirm &amp; start delivery</Text>
          )}
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
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap },
    instruction: { fontSize: Typography.sizes.body, color: C.text.secondary, lineHeight: 22 },
    cameraArea: { position: 'relative', borderRadius: Radius.card, overflow: 'hidden' },
    cameraPlaceholder: { height: 280, backgroundColor: C.background.card, borderWidth: 1, borderColor: C.background.divider, borderRadius: Radius.card, alignItems: 'center', justifyContent: 'center', gap: 12 },
    cameraHint: { fontSize: Typography.sizes.body, color: C.text.tertiary },
    preview: { width: '100%', height: 280, borderRadius: Radius.card },
    cameraCornerTL: { position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: C.accent, borderTopLeftRadius: 4 },
    cameraCornerBR: { position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: C.accent, borderBottomRightRadius: 4 },
    confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    confirmText: { fontSize: Typography.sizes.body, color: C.status.green, fontWeight: Typography.weights.medium },
    errorText: { fontSize: Typography.sizes.label, color: C.status.red },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
