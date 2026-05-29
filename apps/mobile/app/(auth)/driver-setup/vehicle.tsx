import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { TonnagePicker } from '@components/ui/TonnagePicker';
import { TONNAGE_TIERS, TRUCK_TYPES, TRUCK_TYPE_LABELS, TRUCK_TYPE_HAS_TONNAGE, type TruckType } from '@constants/index';
import { updateDriverProfile } from '@services';
import { showError } from '@components/ui/AppAlert';

export default function VehicleSetupScreen() {
  const router = useRouter();
  const [truckType, setTruckType] = useState<TruckType>('TRUCK');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [reg, setReg] = useState('');
  const [tonnes, setTonnes] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const hasTonnage = TRUCK_TYPE_HAS_TONNAGE[truckType];
  const yearNum = parseInt(year, 10);
  const isValid =
    make.trim().length > 0 &&
    model.trim().length > 0 &&
    reg.trim().length > 0 &&
    !isNaN(yearNum) &&
    yearNum >= 1990 &&
    yearNum <= new Date().getFullYear() + 1;

  async function handleContinue() {
    if (!isValid) return;
    setLoading(true);
    try {
      await updateDriverProfile({
        truckType,
        truckMake: make.trim(),
        truckModel: model.trim(),
        truckYear: yearNum,
        truckRegistration: reg.trim().toUpperCase(),
        capacityTonnes: hasTonnage ? (tonnes as 1 | 1.5 | 2 | 5 | 10 | 20 | 30) : 1,
      });
      router.push('/(auth)/driver-setup/documents');
    } catch (err) {
      showError((err as Error).message ?? 'Please try again.', 'Could not save');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressWrap}>
        <ProgressBar pct={33} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>DRIVER SETUP · 1 OF 3</Text>
        <Text style={styles.heading}>Your truck</Text>
        <Text style={styles.sub}>This determines which loads you'll be matched with.</Text>

        {/* Truck type */}
        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Truck type</Text>
          <View style={styles.typeRow}>
            {TRUCK_TYPES.map((t) => {
              const active = truckType === t;
              return (
                <Pressable
                  key={t}
                  style={[styles.typePill, active && styles.typePillActive]}
                  onPress={() => setTruckType(t)}
                >
                  <Text style={[styles.typePillText, active && styles.typePillTextActive]}>
                    {TRUCK_TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Make</Text>
            <TextInput
              style={styles.input}
              value={make}
              onChangeText={setMake}
              placeholder="e.g. Isuzu"
              placeholderTextColor={C.text.tertiary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              value={model}
              onChangeText={setModel}
              placeholder="e.g. NQR"
              placeholderTextColor={C.text.tertiary}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={year}
              onChangeText={setYear}
              placeholder="e.g. 2019"
              placeholderTextColor={C.text.tertiary}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Registration</Text>
            <TextInput
              style={styles.input}
              value={reg}
              onChangeText={setReg}
              placeholder="e.g. ABC 1234"
              placeholderTextColor={C.text.tertiary}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </View>

        {hasTonnage ? (
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Load capacity</Text>
            <TonnagePicker value={tonnes} onChange={setTonnes} />
          </View>
        ) : (
          <View style={styles.standardCapacity}>
            <Text style={styles.standardCapacityLabel}>Load capacity</Text>
            <Text style={styles.standardCapacityValue}>Standard</Text>
          </View>
        )}

        <Pressable
          style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!isValid || loading}
        >
          {loading
            ? <ActivityIndicator color={C.background.primary} />
            : <Text style={styles.btnText}>Continue</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    progressWrap: { paddingHorizontal: Spacing.screenH, paddingTop: 8 },
    content: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: 40 },
    eyebrow: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    heading: { fontSize: Typography.sizes.heading, fontWeight: Typography.weights.bold, color: C.text.primary },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary, marginTop: -4 },
    fieldBlock: { gap: 8 },
    label: { fontSize: Typography.sizes.label, color: C.text.secondary },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.gapSm },
    typePill: {
      height: Components.pillHeight,
      paddingHorizontal: 16,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: C.background.divider,
      backgroundColor: C.background.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typePillActive: {
      backgroundColor: 'rgba(245,166,35,0.12)',
      borderColor: 'rgba(245,166,35,0.40)',
    },
    typePillText: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.medium,
      color: C.text.secondary,
    },
    typePillTextActive: {
      color: C.accent,
      fontWeight: Typography.weights.semibold,
    },
    row: { flexDirection: 'row', gap: Spacing.gap },
    rowItem: { flex: 1, gap: 6 },
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
    standardCapacity: {
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button,
      paddingHorizontal: Spacing.card,
      paddingVertical: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    standardCapacityLabel: {
      fontSize: Typography.sizes.body,
      color: C.text.secondary,
    },
    standardCapacityValue: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    btn: {
      height: Components.buttonHeight,
      backgroundColor: C.accent,
      borderRadius: Radius.button,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.gapSm,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
