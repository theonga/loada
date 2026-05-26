import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const setRole = useAuthStore((s) => s.setRole);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const handleSelect = (role: 'shipper' | 'driver') => {
    setRole(role);
    router.push('/(auth)/phone');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <Ionicons name="flash" size={48} color={C.accent} />
          <Text style={styles.brand}>Loada</Text>
          <Text style={styles.tagline}>Freight. Bid. Move.</Text>
        </View>

        <Text style={styles.heading}>What are you here to do?</Text>

        <View style={styles.cards}>
          <Pressable style={styles.card} onPress={() => handleSelect('shipper')}>
            <Ionicons name="cube-outline" size={36} color={C.accent} />
            <Text style={styles.cardTitle}>Ship freight</Text>
            <Text style={styles.cardDesc}>Post loads, get bids from drivers, move cargo</Text>
          </Pressable>

          <Pressable style={styles.card} onPress={() => handleSelect('driver')}>
            <Ionicons name="car-sport-outline" size={36} color={C.accent} />
            <Text style={styles.cardTitle}>Drive & earn</Text>
            <Text style={styles.cardDesc}>Browse loads, place bids, build your income</Text>
          </Pressable>
        </View>

        <Text style={styles.footnote}>Both? Create two profiles later.</Text>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    content: { flex: 1, padding: Spacing.screenH, justifyContent: 'center', gap: Spacing.section },
    logoArea: { alignItems: 'center', gap: 8 },
    brand: { fontSize: Typography.sizes.heading, fontWeight: Typography.weights.bold, color: C.text.primary, letterSpacing: -0.5 },
    tagline: { fontSize: Typography.sizes.body, color: C.text.secondary },
    heading: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary, textAlign: 'center', letterSpacing: -0.3 },
    cards: { gap: Spacing.gap },
    card: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: 20, gap: 8, minHeight: Components.touchMin },
    cardTitle: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    cardDesc: { fontSize: Typography.sizes.body, color: C.text.secondary, lineHeight: 22 },
    footnote: { textAlign: 'center', fontSize: Typography.sizes.label, color: C.text.tertiary },
  });
}
