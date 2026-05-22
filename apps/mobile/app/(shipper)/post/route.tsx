import React, { useState, useMemo } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { MapBg } from '@components/ui/MapBg';
import { MapPin } from '@components/ui/MapPin';

export default function PostRouteScreen() {
  const router = useRouter();
  const [pickup, setPickup] = useState('Avondale Shops, Harare');
  const [dropoff, setDropoff] = useState('');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>1 / 4</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.progress}>
        <ProgressBar pct={25} />
      </View>

      <View style={styles.titleArea}>
        <Text style={styles.title}>Route</Text>
      </View>

      <View style={styles.inputsArea}>
        <View style={styles.dotCol}>
          <View style={styles.line} />
          <View style={styles.dotWhite} />
          <View style={styles.dotAccent} />
        </View>
        <View style={styles.inputs}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>PICKUP</Text>
            <TextInput
              style={styles.input}
              value={pickup}
              onChangeText={setPickup}
              placeholderTextColor={C.text.tertiary}
              placeholder="Enter pickup address"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>DROPOFF</Text>
            <TextInput
              style={styles.input}
              value={dropoff}
              onChangeText={setDropoff}
              placeholderTextColor={C.text.tertiary}
              placeholder="Beitbridge border post"
            />
          </View>
        </View>
      </View>

      {/* Mini map */}
      <View style={styles.miniMap}>
        <MapBg>
          <View style={styles.originPin}><MapPin kind="origin" /></View>
          <View style={styles.destPin}><MapPin kind="dest" /></View>
        </MapBg>
      </View>

      {/* Distance stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>DISTANCE</Text>
          <Text style={styles.statValue}>583 <Text style={styles.statUnit}>km</Text></Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>DRIVE TIME</Text>
          <Text style={styles.statValue}>7h 40<Text style={styles.statUnit}>m</Text></Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TOLLS</Text>
          <Text style={styles.statValue}>$24</Text>
        </View>
      </View>

      <View style={styles.spacer} />
      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !pickup && styles.btnDisabled]}
          onPress={() => router.push('/(shipper)/post/cargo')}
          disabled={!pickup}
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
    titleArea: { padding: Spacing.screenH, paddingBottom: 0 },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary, letterSpacing: -0.4 },
    inputsArea: { flexDirection: 'row', padding: Spacing.screenH, gap: 12 },
    dotCol: { width: 18, alignItems: 'center', paddingTop: 40, position: 'relative' },
    line: { position: 'absolute', top: 44, bottom: 44, width: 1, backgroundColor: C.background.divider },
    dotWhite: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.text.primary, marginBottom: 52 },
    dotAccent: { width: 10, height: 10, backgroundColor: C.accent },
    inputs: { flex: 1, gap: Spacing.gap },
    inputGroup: { gap: 6 },
    label: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    input: {
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider,
      paddingHorizontal: 14, height: Components.inputHeight,
      color: C.text.primary, fontSize: Typography.sizes.body,
    },
    miniMap: { marginHorizontal: Spacing.screenH, height: 160, borderRadius: Radius.card, overflow: 'hidden', borderWidth: 1, borderColor: C.background.divider },
    originPin: { position: 'absolute', top: '25%', left: '25%' },
    destPin: { position: 'absolute', bottom: '25%', right: '25%' },
    stats: { flexDirection: 'row', paddingHorizontal: Spacing.screenH, paddingTop: 12, justifyContent: 'space-between' },
    stat: { gap: 4 },
    statLabel: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1 },
    statValue: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    statUnit: { fontSize: Typography.sizes.label, color: C.text.secondary, fontWeight: Typography.weights.regular },
    spacer: { flex: 1 },
    footer: { padding: Spacing.screenH },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
