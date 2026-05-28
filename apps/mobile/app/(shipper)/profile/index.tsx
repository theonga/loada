import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Pressable, ScrollView, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useColors, ColorPalette, Typography, Spacing, Radius, Components,
} from '@constants/theme';
import { Avatar } from '@components/ui/Avatar';
import { useAuthStore } from '@store/auth.store';
import { getShipperJobs, updateProfile } from '@services';
import { showError, showConfirm } from '@components/ui/AppAlert';
import { JobStatus } from '@constants/index';
import type { Job } from '@/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function ShipperProfileScreen() {
  const router = useRouter();
  const { user, logout, updateName } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    getShipperJobs(user?.id ?? '').then(setJobs).catch(() => {});
  }, [user?.id]);

  const startEdit = useCallback(() => {
    setNameInput(user?.name ?? '');
    setEditing(true);
  }, [user?.name]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setNameInput('');
  }, []);

  const saveEdit = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === user?.name) { cancelEdit(); return; }
    setSaving(true);
    try {
      await updateProfile(trimmed);
      updateName(trimmed);
      setEditing(false);
    } catch {
      showError('Could not update your name. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [nameInput, user?.name, cancelEdit, updateName]);

  const completedJobs = jobs.filter((j) => j.status === JobStatus.COMPLETED).length;

  const menuItems: { label: string; icon: IoniconName; onPress: () => void }[] = [
    { label: 'Help & support', icon: 'help-circle-outline', onPress: () => router.push('/(shared)/help') },
    { label: 'Settings', icon: 'settings-outline', onPress: () => router.push('/(shared)/settings') },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* ── Appbar ─────────────────────────────────────────────────────────── */}
      <View style={styles.appbar}>
        {editing ? (
          <Pressable style={styles.appbarAction} onPress={cancelEdit} disabled={saving}>
            <Text style={[styles.appbarActionText, { color: C.text.secondary }]}>Cancel</Text>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}

        <Text style={styles.appbarTitle}>
          {editing ? 'Edit profile' : 'Profile'}
        </Text>

        {editing ? (
          <Pressable style={styles.appbarAction} onPress={saveEdit} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={C.accent} />
              : <Text style={[styles.appbarActionText, { color: C.accent }]}>Save</Text>
            }
          </Pressable>
        ) : (
          <Pressable style={styles.appbarAction} onPress={startEdit}>
            <Text style={[styles.appbarActionText, { color: C.accent }]}>Edit</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Hero card ──────────────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <Avatar name={user?.name || 'S'} size={72} />

          {editing ? (
            <View style={styles.editFields}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  style={[styles.fieldInput, { color: C.text.primary, borderColor: C.accent, backgroundColor: C.background.elevated }]}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="Your full name"
                  placeholderTextColor={C.text.tertiary}
                  returnKeyType="done"
                  onSubmitEditing={saveEdit}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                <View style={[styles.fieldDisplay, { backgroundColor: C.background.elevated, borderColor: C.background.divider }]}>
                  <Text style={[styles.fieldDisplayText, { color: C.text.secondary }]}>
                    {user?.phone ?? '—'}
                  </Text>
                  <Text style={styles.fieldNote}>Contact support to change</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{user?.name || '—'}</Text>
              <Text style={styles.heroPhone}>{user?.phone ?? '—'}</Text>
              <View style={[styles.roleBadge, { borderColor: C.background.divider, backgroundColor: C.background.elevated }]}>
                <Text style={[styles.roleBadgeText, { color: C.text.secondary }]}>Shipper</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Stats ──────────────────────────────────────────────────────────── */}
        {!editing && (
          <>
            <View style={styles.statsCard}>
              {[
                { value: String(jobs.length), label: 'Total jobs' },
                { value: String(completedJobs), label: 'Completed' },
                { value: '4.9', label: 'Rating' },
              ].map(({ value, label }, i, arr) => (
                <React.Fragment key={label}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={[styles.statDivider, { backgroundColor: C.background.divider }]} />}
                </React.Fragment>
              ))}
            </View>

            {/* ── Menu ───────────────────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACCOUNT</Text>
              <View style={styles.menuCard}>
                {menuItems.map(({ label, icon, onPress }, i) => (
                  <React.Fragment key={label}>
                    <Pressable
                      style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: C.background.elevated }]}
                      onPress={onPress}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: C.background.elevated }]}>
                        <Ionicons name={icon} size={18} color={C.text.secondary} />
                      </View>
                      <Text style={styles.menuLabel}>{label}</Text>
                      <Ionicons name="chevron-forward" size={16} color={C.text.tertiary} />
                    </Pressable>
                    {i < menuItems.length - 1 && (
                      <View style={[styles.menuDivider, { backgroundColor: C.background.divider }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* ── Sign out ────────────────────────────────────────────────────── */}
            <Pressable
              style={[styles.signOutBtn, { borderColor: 'rgba(244,67,54,0.30)' }]}
              onPress={() => showConfirm({
                title: 'Sign out?',
                message: 'You can sign back in at any time.',
                confirmLabel: 'Sign out',
                destructive: true,
                onConfirm: () => { logout(); router.replace('/(auth)'); },
              })}
            >
              <Text style={[styles.signOutText, { color: C.status.red }]}>Sign out</Text>
            </Pressable>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background.primary },

    // Appbar
    appbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenH,
      height: 52,
    },
    appbarTitle: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    appbarAction: {
      minWidth: 72,
      height: Components.touchMin,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appbarActionText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.medium,
    },

    content: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: 40 },

    // Hero card
    heroCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: Spacing.card,
      gap: 14,
    },
    heroInfo: { alignItems: 'center', gap: 6 },
    heroName: {
      fontSize: Typography.sizes.cardTitle,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    heroPhone: {
      fontSize: Typography.sizes.body,
      color: C.text.secondary,
      fontVariant: ['tabular-nums'],
    },
    roleBadge: {
      marginTop: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.pill,
      borderWidth: 1,
    },
    roleBadgeText: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.medium,
      letterSpacing: 0.3,
    },

    // Edit fields
    editFields: { width: '100%', gap: Spacing.gap },
    fieldGroup: { gap: 6 },
    fieldLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: '600',
      letterSpacing: 1.2,
      color: C.text.secondary,
    },
    fieldInput: {
      height: Components.inputHeight,
      borderRadius: Radius.button,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      fontSize: Typography.sizes.body,
    },
    fieldDisplay: {
      borderRadius: Radius.button,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 2,
    },
    fieldDisplayText: {
      fontSize: Typography.sizes.body,
      fontVariant: ['tabular-nums'],
    },
    fieldNote: {
      fontSize: Typography.sizes.chip,
      color: C.text.tertiary,
    },

    // Stats
    statsCard: {
      flexDirection: 'row',
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      padding: Spacing.card,
    },
    stat: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: {
      fontSize: Typography.sizes.cardTitle,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
      fontVariant: ['tabular-nums'],
    },
    statLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    statDivider: { width: 1 },

    // Menu
    section: { gap: 8 },
    sectionLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: '600',
      letterSpacing: 1.2,
      color: C.text.tertiary,
      paddingLeft: 4,
    },
    menuCard: {
      backgroundColor: C.background.card,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: C.background.divider,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: Spacing.card,
      gap: 12,
      minHeight: Components.touchMin,
    },
    menuIcon: {
      width: 32, height: 32, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    menuLabel: {
      flex: 1,
      fontSize: Typography.sizes.body,
      color: C.text.primary,
    },
    menuDivider: { height: StyleSheet.hairlineWidth, marginLeft: 56 },

    // Sign out
    signOutBtn: {
      height: Components.buttonHeight,
      borderRadius: Radius.button,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.gap,
    },
    signOutText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.medium,
    },
  });
}
