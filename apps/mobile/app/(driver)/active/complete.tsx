import React, { useState, useMemo } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ImgBox } from '@components/ui/ImgBox';

export default function JobCompleteScreen() {
  const router = useRouter();
  const [photoTaken, setPhotoTaken] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleComplete = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    router.replace('/(driver)/earnings');
  };

  const canSubmit = photoTaken && recipient.length > 2;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Complete delivery</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Take a photo of the delivered goods and get the recipient's name</Text>

        <Pressable style={styles.cameraArea} onPress={() => setPhotoTaken(true)}>
          <ImgBox width="100%" height={220} borderRadius={Radius.card} label={photoTaken ? '✓ Photo captured' : 'Tap to photograph delivery'} />
        </Pressable>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>RECIPIENT NAME</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Who received the delivery?"
            placeholderTextColor={C.text.tertiary}
          />
        </View>

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, !canSubmit && styles.btnDisabled]}
          onPress={handleComplete}
          disabled={!canSubmit || loading}
        >
          <Text style={styles.btnText}>{loading ? 'Completing…' : 'Mark as delivered'}</Text>
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
    cameraArea: {},
    inputGroup: { gap: 8 },
    label: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    input: { backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, paddingHorizontal: 14, height: Components.inputHeight, color: C.text.primary, fontSize: Typography.sizes.body },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
