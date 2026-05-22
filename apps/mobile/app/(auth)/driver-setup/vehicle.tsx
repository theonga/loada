import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { TonnagePicker } from '@components/ui/TonnagePicker';
import { TONNAGE_TIERS } from '@constants/index';

export default function VehicleSetupScreen() {
  const router = useRouter();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [reg, setReg] = useState('');
  const [tonnes, setTonnes] = useState<number>(TONNAGE_TIERS[0]);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const isValid = make.trim() && model.trim() && reg.trim();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressWrap}>
        <ProgressBar pct={0.4} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>DRIVER SETUP · 2 OF 4</Text>
        <Text style={styles.heading}>Your truck</Text>

        <Text style={styles.label}>Make</Text>
        <TextInput
          style={styles.input}
          value={make}
          onChangeText={setMake}
          placeholder="e.g. DAF"
          placeholderTextColor={C.text.tertiary}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder="e.g. CF 85"
          placeholderTextColor={C.text.tertiary}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Registration number</Text>
        <TextInput
          style={styles.input}
          value={reg}
          onChangeText={setReg}
          placeholder="e.g. ABC 1234"
          placeholderTextColor={C.text.tertiary}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Load capacity</Text>
        <TonnagePicker value={tonnes} onChange={setTonnes} />

        <Pressable
          style={[styles.btn, !isValid && styles.btnDisabled]}
          onPress={() => router.push('/(auth)/driver-setup/documents')}
          disabled={!isValid}
        >
          <Text style={styles.btnText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    progressWrap: { paddingHorizontal: Spacing.screenH, paddingTop: 8 },
    content: { padding: Spacing.screenH, gap: Spacing.gap },
    eyebrow: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    heading: { fontSize: Typography.sizes.heading, fontWeight: Typography.weights.bold, color: C.text.primary },
    label: { fontSize: Typography.sizes.label, color: C.text.secondary, marginTop: Spacing.gapSm },
    input: {
      height: Components.inputHeight,
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      paddingHorizontal: Spacing.card,
      fontSize: Typography.sizes.body,
      color: C.text.primary,
    },
    btn: {
      height: Components.buttonHeight,
      backgroundColor: C.accent,
      borderRadius: Radius.button,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.section,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
