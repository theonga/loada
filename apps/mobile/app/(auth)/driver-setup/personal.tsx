import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';

export default function PersonalSetupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressWrap}>
        <ProgressBar pct={0.2} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>DRIVER SETUP · 1 OF 4</Text>
        <Text style={styles.heading}>Personal details</Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Tatenda Mukamuri"
          placeholderTextColor={C.text.tertiary}
          autoCapitalize="words"
        />

        <Pressable
          style={[styles.btn, !name.trim() && styles.btnDisabled]}
          onPress={() => router.push('/(auth)/driver-setup/vehicle')}
          disabled={!name.trim()}
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
