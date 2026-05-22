import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { MarketReferenceWidget } from '@components/ui/MarketReferenceWidget';
import { MOCK_MARKET_REFERENCE } from '@services/mock/data';

export default function PostPricingScreen() {
  const router = useRouter();
  const [price, setPrice] = useState('480');
  const numPrice = parseInt(price, 10) || 0;
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>3 / 4</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.progress}>
        <ProgressBar pct={75} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your asking price</Text>
        <Text style={styles.sub}>Drivers will bid against this price</Text>

        {/* Hero price input */}
        <View style={styles.priceInputRow}>
          <Text style={styles.currency}>$</Text>
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={C.text.tertiary}
            autoFocus
          />
        </View>

        <MarketReferenceWidget
          data={MOCK_MARKET_REFERENCE}
          userPrice={numPrice}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !numPrice && styles.btnDisabled]}
          onPress={() => router.push('/(shipper)/post/confirm')}
          disabled={!numPrice}
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
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary },
    priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    currency: { fontSize: Typography.sizes.heroPrice, fontWeight: Typography.weights.light, color: C.text.secondary },
    priceInput: {
      fontSize: Typography.sizes.heroPrice,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      fontVariant: ['tabular-nums'],
      flex: 1,
      padding: 0,
    },
    footer: { padding: Spacing.screenH },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnDisabled: { opacity: 0.5 },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
