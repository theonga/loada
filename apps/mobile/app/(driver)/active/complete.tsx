import React, { useState, useMemo } from 'react';
import { View, Pressable, TextInput, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useJobStore } from '@store/job.store';
import { usePhotoUpload } from '@hooks/usePhotoUpload';
import { confirmDelivery } from '@services';

export default function JobCompleteScreen() {
  const router = useRouter();
  const job = useJobStore((s) => s.activeJob);
  const setActiveJob = useJobStore((s) => s.setActiveJob);
  const { state: photoState, pickAndUpload } = usePhotoUpload('delivery');
  const [recipient, setRecipient] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const photoReady = photoState.status === 'done';
  const uploading = photoState.status === 'uploading';
  const canSubmit = photoReady && recipient.trim().length > 1 && !submitting;

  async function handleComplete() {
    if (!job || photoState.status !== 'done') return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await confirmDelivery(job.id, photoState.s3Url, recipient.trim());
      setActiveJob(null);
      router.replace('/(driver)/earnings');
    } catch {
      setSubmitError('Failed to confirm delivery. Try again.');
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Complete delivery</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Take a photo of the delivered goods and get the recipient's name</Text>

        <Pressable
          style={styles.cameraArea}
          onPress={photoReady || uploading ? undefined : pickAndUpload}
          disabled={uploading || submitting}
        >
          {photoState.status === 'done' ? (
            <Image source={{ uri: photoState.s3Url }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.cameraPlaceholder}>
              {uploading ? (
                <ActivityIndicator color={C.accent} size="large" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={48} color={C.text.tertiary} />
                  <Text style={styles.cameraHint}>Tap to photograph delivery</Text>
                </>
              )}
            </View>
          )}
        </Pressable>

        {photoState.status === 'error' && (
          <Text style={styles.errorText}>{photoState.message}</Text>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>RECIPIENT NAME</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Who received the delivery?"
            placeholderTextColor={C.text.tertiary}
            editable={!submitting}
          />
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          onPress={handleComplete}
          disabled={!canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={C.background.primary} />
          ) : (
            <Text style={styles.btnText}>Mark as delivered</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { paddingHorizontal: Spacing.screenH, height: 56, justifyContent: 'center' },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap },
    instruction: { fontSize: Typography.sizes.body, color: C.text.secondary, lineHeight: 22 },
    cameraArea: { borderRadius: Radius.card, overflow: 'hidden' },
    cameraPlaceholder: { height: 220, backgroundColor: C.background.card, borderWidth: 1, borderColor: C.background.divider, borderRadius: Radius.card, alignItems: 'center', justifyContent: 'center', gap: 12 },
    cameraHint: { fontSize: Typography.sizes.body, color: C.text.tertiary },
    preview: { width: '100%', height: 220, borderRadius: Radius.card },
    inputGroup: { gap: 8 },
    label: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    input: { backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, paddingHorizontal: 14, height: Components.inputHeight, color: C.text.primary, fontSize: Typography.sizes.body },
    errorText: { fontSize: Typography.sizes.label, color: C.status.red },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
