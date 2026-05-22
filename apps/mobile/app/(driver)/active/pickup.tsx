import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ImgBox } from '@components/ui/ImgBox';
import { MOCK_JOBS } from '@services/mock/data';

export default function PickupScreen() {
  const router = useRouter();
  const [photoTaken, setPhotoTaken] = useState(false);
  const job = MOCK_JOBS[1];
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Confirm cargo loaded</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Take a photo of the loaded cargo to confirm pickup</Text>

        {/* Mock camera view */}
        <Pressable
          style={styles.cameraArea}
          onPress={() => setPhotoTaken(true)}
        >
          <ImgBox width="100%" height={280} borderRadius={Radius.card} label={photoTaken ? '✓ Photo taken' : 'Tap to take photo'} />
          {!photoTaken && (
            <View style={styles.cameraCornerTL} />
          )}
          {!photoTaken && (
            <View style={styles.cameraCornerBR} />
          )}
        </Pressable>

        {photoTaken && (
          <View style={styles.confirmRow}>
            <Ionicons name="checkmark-circle" size={18} color={C.status.green} />
            <Text style={styles.confirmText}>Cargo photo taken</Text>
          </View>
        )}

        <View style={styles.spacer} />

        <Pressable
          style={[styles.btn, !photoTaken && styles.btnDisabled]}
          onPress={() => router.replace('/(driver)/active/in-transit')}
          disabled={!photoTaken}
        >
          <Text style={styles.btnText}>Confirm & start delivery</Text>
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
    cameraArea: { position: 'relative' },
    cameraCornerTL: { position: 'absolute', top: 16, left: 16, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: C.accent, borderTopLeftRadius: 4 },
    cameraCornerBR: { position: 'absolute', bottom: 16, right: 16, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: C.accent, borderBottomRightRadius: 4 },
    confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    confirmText: { fontSize: Typography.sizes.body, color: C.status.green, fontWeight: Typography.weights.medium },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
