import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius } from '@constants/theme';
import type { LegalSection } from '@constants/legal';
import { LEGAL_EFFECTIVE_DATE } from '@constants/legal';

interface LegalDocProps {
  title: string;
  sections: LegalSection[];
  /** When defined, only sections with no role or matching this role are shown */
  role?: 'shipper' | 'driver';
}

export function LegalDoc({ title, sections, role }: LegalDocProps) {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const visible = sections.filter((s) => !s.role || !role || s.role === role);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.appbarTitle}>{title}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.meta}>Last updated: {LEGAL_EFFECTIVE_DATE}</Text>

        {visible.map((section) => (
          <View key={section.heading} style={styles.section}>
            {section.role && (
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>
                  {section.role === 'driver' ? 'Drivers' : 'Shippers'}
                </Text>
              </View>
            )}
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Loada Technologies (Private) Limited. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenH,
      height: 56,
      borderBottomWidth: 1,
      borderBottomColor: C.background.divider,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    appbarTitle: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    scroll: { flex: 1 },
    content: { padding: Spacing.screenH, gap: Spacing.section, paddingBottom: 40 },
    meta: {
      fontSize: Typography.sizes.label,
      color: C.text.tertiary,
    },
    section: {
      gap: 8,
    },
    roleChip: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(245,166,35,0.10)',
      borderWidth: 1,
      borderColor: 'rgba(245,166,35,0.25)',
      borderRadius: Radius.chip,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    roleChipText: {
      fontSize: Typography.sizes.chip,
      color: C.accent,
      fontWeight: Typography.weights.semibold,
      letterSpacing: 0.3,
    },
    sectionHeading: {
      fontSize: Typography.sizes.cardTitle,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
      lineHeight: 26,
    },
    sectionBody: {
      fontSize: Typography.sizes.bodySmall,
      color: C.text.secondary,
      lineHeight: 22,
    },
    footer: {
      marginTop: Spacing.section,
      paddingTop: Spacing.section,
      borderTopWidth: 1,
      borderTopColor: C.background.divider,
    },
    footerText: {
      fontSize: Typography.sizes.label,
      color: C.text.tertiary,
      textAlign: 'center',
    },
  });
}
