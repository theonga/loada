import React, { useState, useMemo } from 'react';
import { View, Pressable, Switch, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { useAuthStore } from '@store/auth.store';
import { showConfirm } from '@components/ui/AppAlert';

const LANGUAGES = ['English', 'Shona', 'Ndebele'];

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [lang, setLang] = useState('English');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push notifications</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: C.background.divider, true: C.accent + '44' }}
              thumbColor={pushEnabled ? C.accent : C.text.tertiary}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>SMS alerts</Text>
            <Switch
              value={smsEnabled}
              onValueChange={setSmsEnabled}
              trackColor={{ false: C.background.divider, true: C.accent + '44' }}
              thumbColor={smsEnabled ? C.accent : C.text.tertiary}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>LANGUAGE</Text>
        <View style={styles.card}>
          {LANGUAGES.map((l, i) => (
            <React.Fragment key={l}>
              <Pressable style={styles.langRow} onPress={() => setLang(l)}>
                <Text style={styles.settingLabel}>{l}</Text>
                {lang === l && <Ionicons name="checkmark" size={20} color={C.accent} />}
              </Pressable>
              {i < LANGUAGES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.settingRowBtn}
            onPress={() => showConfirm({
              title: 'Sign out?',
              message: 'You can sign back in at any time.',
              confirmLabel: 'Sign out',
              destructive: true,
              onConfirm: () => { logout(); router.replace('/(auth)'); },
            })}
          >
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.settingRowBtn}
            onPress={() => showConfirm({
              title: 'Delete account?',
              message: 'All your data will be permanently removed. This cannot be undone.',
              confirmLabel: 'Delete account',
              destructive: true,
              onConfirm: () => { logout(); router.replace('/(auth)'); },
            })}
          >
            <Text style={styles.deleteText}>Delete account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    content: { padding: Spacing.screenH, gap: Spacing.gapSm, paddingBottom: Spacing.section },
    sectionTitle: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2, marginTop: Spacing.gap },
    card: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, overflow: 'hidden' },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.card, minHeight: Components.touchMin },
    settingRowBtn: { padding: Spacing.card, minHeight: Components.touchMin, justifyContent: 'center' },
    settingLabel: { fontSize: Typography.sizes.body, color: C.text.primary },
    divider: { height: 1, backgroundColor: C.background.divider },
    langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.card, minHeight: Components.touchMin },
    logoutText: { fontSize: Typography.sizes.body, color: C.status.red },
    deleteText: { fontSize: Typography.sizes.body, color: C.status.red },
  });
}
