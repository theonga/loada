import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, TextInput, Pressable, ScrollView, StyleSheet, Animated } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { MarketReferenceWidget } from '@components/ui/MarketReferenceWidget';
import { useDraftJobStore } from '@store/draftJob.store';
import { getMarketReference } from '@services';
import type { MarketReference } from '@/types';

export default function PostPricingScreen() {
  const router = useRouter();
  const draft = useDraftJobStore((s) => s.draft);
  const setPrice = useDraftJobStore((s) => s.setPrice);

  const [price, setRawPrice] = useState(draft.askingPrice ? String(Math.round(draft.askingPrice)) : '');
  const [isSuggested, setIsSuggested] = useState(false);
  const [marketRef, setMarketRef] = useState<MarketReference | null>(null);
  const [loadingRef, setLoadingRef] = useState(true);
  const suggestAnim = useRef(new Animated.Value(0)).current;

  const numPrice = parseInt(price, 10) || 0;
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    const origin = draft.origin;
    const dest = draft.dest;
    const tonnes = draft.requiredTonnes ?? 10;
    if (!origin || !dest) { setLoadingRef(false); return; }

    getMarketReference(
      { originLat: origin.lat, originLng: origin.lng, destLat: dest.lat, destLng: dest.lng },
      tonnes,
    )
      .then((ref) => {
        setMarketRef(ref);
        // Pre-fill only if the shipper hasn't manually set a price yet
        if (!draft.askingPrice && ref.median > 0) {
          setRawPrice(String(Math.round(ref.median)));
          setIsSuggested(true);
          Animated.spring(suggestAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRef(false));
  }, []);                                     // eslint-disable-line react-hooks/exhaustive-deps

  function handlePriceChange(t: string) {
    setRawPrice(t.replace(/[^0-9]/g, ''));
    if (isSuggested) {
      setIsSuggested(false);
      Animated.timing(suggestAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }

  function useSuggestedPrice() {
    if (marketRef?.median) {
      setRawPrice(String(Math.round(marketRef.median)));
      setIsSuggested(true);
      Animated.spring(suggestAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
    }
  }

  const suggestChipStyle = {
    opacity: suggestAnim,
    transform: [{ scale: suggestAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.step}>3 / 4</Text>
        <View style={{ width: 44 }} />
      </View>
      <ProgressBar pct={75} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.title}>Your asking price</Text>
          <Text style={styles.sub}>Drivers will bid against this. You can negotiate via chat.</Text>
        </View>

        {/* Price input */}
        <View style={styles.priceBlock}>
          <View style={styles.priceInputRow}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={handlePriceChange}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={C.text.tertiary}
              autoFocus={!loadingRef}
            />
          </View>

          {/* Suggested chip — animates in when market ref pre-fills the price */}
          <Animated.View style={[styles.suggestChip, suggestChipStyle, { borderColor: 'rgba(245,166,35,0.25)', backgroundColor: 'rgba(245,166,35,0.08)' }]}>
            <Ionicons name="flash-outline" size={12} color={C.accent} />
            <Text style={[styles.suggestChipText, { color: C.accent }]}>
              Suggested based on {marketRef?.jobCount && marketRef.jobCount > 0 ? 'recent jobs' : 'distance & load'}
            </Text>
          </Animated.View>

          {/* If user changed the price, show a link to restore the suggestion */}
          {!isSuggested && marketRef?.median && marketRef.median > 0 && (
            <Pressable onPress={useSuggestedPrice} style={styles.restoreRow}>
              <Text style={styles.restoreText}>
                Use suggested ${Math.round(marketRef.median)}
              </Text>
            </Pressable>
          )}
        </View>

        {marketRef && (
          <MarketReferenceWidget data={marketRef} userPrice={numPrice} />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, !numPrice && styles.btnDisabled]}
          onPress={() => {
            if (!numPrice) return;
            setPrice(numPrice);
            router.push('/(shipper)/post/confirm');
          }}
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
    appbar: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.screenH, height: 56,
    },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    step: { fontSize: Typography.sizes.label, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.screenH, gap: Spacing.section },
    title: {
      fontSize: Typography.sizes.screenTitle,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      letterSpacing: -0.4,
    },
    sub: { fontSize: Typography.sizes.body, color: C.text.secondary, marginTop: 4 },

    priceBlock: { gap: 10 },
    priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    currency: {
      fontSize: Typography.sizes.heroPrice,
      fontWeight: Typography.weights.light,
      color: C.text.secondary,
      lineHeight: 86,
    },
    priceInput: {
      fontSize: Typography.sizes.heroPrice,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      fontVariant: ['tabular-nums'],
      flex: 1,
      padding: 0,
      lineHeight: 86,
    },
    suggestChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: Radius.pill, borderWidth: 1,
    },
    suggestChipText: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.medium,
    },
    restoreRow: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    restoreText: {
      fontSize: Typography.sizes.chip,
      color: C.accent,
      textDecorationLine: 'underline',
    },

    footer: { padding: Spacing.screenH, paddingBottom: Spacing.screenH },
    btn: {
      height: Components.buttonHeight,
      backgroundColor: C.accent,
      borderRadius: Radius.button,
      alignItems: 'center', justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.4 },
    btnText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.background.primary,
    },
  });
}
