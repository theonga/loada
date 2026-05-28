import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { TonnagePicker } from '@components/ui/TonnagePicker';
import { Chip } from '@components/ui/Chip';
import { useDraftJobStore } from '@store/draftJob.store';

const REQUIREMENTS = ['FRAGILE', 'REFRIGERATED', 'OVERSIZED', 'HAZARDOUS'] as const;

export default function PostCargoScreen() {
  const router = useRouter();
  const setCargoDraft = useDraftJobStore((s) => s.setCargo);
  const draft = useDraftJobStore((s) => s.draft);
  const [cargo, setCargo] = useState(draft.cargoDescription || '');
  const [tonnes, setTonnes] = useState(draft.requiredTonnes ?? 1);
  const [reqs, setReqs] = useState<string[]>(draft.specialRequirements || []);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const toggleReq = (r: string) =>
    setReqs((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>2 / 4</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.progress}>
        <ProgressBar pct={50} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>What are you moving?</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CARGO DESCRIPTION</Text>
          <TextInput
            style={styles.textArea}
            value={cargo}
            onChangeText={setCargo}
            placeholder="e.g. 50kg bags of cement, 200 units"
            placeholderTextColor={C.text.tertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TONNAGE REQUIRED</Text>
          <TonnagePicker value={tonnes} onChange={setTonnes} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SPECIAL REQUIREMENTS</Text>
          <View style={styles.reqs}>
            {REQUIREMENTS.map((r) => (
              <Pressable key={r} onPress={() => toggleReq(r)}>
                <Chip variant={reqs.includes(r) ? 'amber' : 'default'}>{r}</Chip>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !cargo && styles.btnDisabled]}
          onPress={() => {
            setCargoDraft(cargo, tonnes, reqs);
            router.push('/(shipper)/post/pricing');
          }}
          disabled={!cargo}
        >
          <Text style={styles.btnText}>Continue →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screenH, height: 56 },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    step: { fontSize: Typography.sizes.label, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    progress: { paddingHorizontal: Spacing.screenH },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.section },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary, letterSpacing: -0.4 },
    section: { gap: Spacing.gap },
    sectionLabel: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    textArea: {
      backgroundColor: C.background.elevated, borderRadius: Radius.button,
      borderWidth: 1, borderColor: C.background.divider,
      paddingHorizontal: 14, paddingVertical: 12,
      color: C.text.primary, fontSize: Typography.sizes.body,
      minHeight: 80, textAlignVertical: 'top',
    },
    reqs: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.gapSm },
    footer: { padding: Spacing.screenH },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
