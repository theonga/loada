import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Pressable, ScrollView, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useColors, ColorPalette, Typography, Spacing, Radius, Components,
} from '@constants/theme';
import { Avatar } from '@components/ui/Avatar';
import { useAuthStore } from '@store/auth.store';
import { getShipperJobs, updateProfile, switchRole } from '@services';
import { showError, showConfirm } from '@components/ui/AppAlert';
import { JobStatus } from '@constants/index';
import type { Job } from '@/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function ShipperProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, updateName, updateEmail } = useAuthStore();
  const canSwitchRole = user?.role === 'BOTH';
  const [jobs, setJobs] = useState<Job[]>([]);

  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);

  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    getShipperJobs(user?.id ?? '').then(setJobs).catch(() => {});
  }, [user?.id]);

  const startEdit = useCallback(() => {
    setNameInput(user?.name ?? '');
    setEmailInput(user?.email ?? '');
    setEditing(true);
  }, [user?.name, user?.email]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setNameInput('');
    setEmailInput('');
  }, []);

  const saveEdit = useCallback(async () => {
    const nameTrimmed = nameInput.trim();
    const emailTrimmed = emailInput.trim();
    if (!nameTrimmed && emailTrimmed === (user?.email ?? '')) { cancelEdit(); return; }
    setSaving(true);
    try {
      await updateProfile({ name: nameTrimmed || undefined, email: emailTrimmed || null });
      if (nameTrimmed) updateName(nameTrimmed);
      updateEmail(emailTrimmed || null);
      setEditing(false);
    } catch {
      showError('Could not update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [nameInput, emailInput, user?.email, cancelEdit, updateName, updateEmail]);

  const completedJobs = jobs.filter((j) => j.status === JobStatus.COMPLETED).length;

  const handleSwitchToDriver = useCallback(async () => {
    try {
      await switchRole('driver');
      router.replace('/(driver)');
    } catch {
      showError("Couldn't switch to driver. Try again.");
    }
  }, [router]);

  const menuItems: { label: string; icon: IoniconName; onPress: () => void }[] = [
    ...(canSwitchRole ? [{
      label: 'Switch to Driver',
      icon: 'swap-horizontal-outline' as IoniconName,
      onPress: handleSwitchToDriver,
    }] : []),
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.section * 2 }]}
        keyboardShouldPersistTaps="handled"
      >

        {editing ? (
          /* ── Flat edit form — no card wrapper ──────────────────────────────── */
          <View style={styles.editFields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <TextInput
                style={[styles.fieldInput, { color: C.text.primary }]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Your full name"
                placeholderTextColor={C.text.tertiary}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
              <View style={[styles.fieldDisplay, { backgroundColor: C.background.elevated }]}>
                <Text style={[styles.fieldDisplayText, { color: C.text.secondary }]}>
                  {user?.phone ?? '—'}
                </Text>
                <Text style={styles.fieldNote}>Contact support to change</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                EMAIL <Text style={styles.fieldOptional}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: C.text.primary }]}
                value={emailInput}
                onChangeText={setEmailInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="your@email.com"
                placeholderTextColor={C.text.tertiary}
                returnKeyType="done"
                onSubmitEditing={saveEdit}
              />
            </View>
          </View>
        ) : (
          /* ── View mode hero card ──────────────────────────────────────────── */
          <View style={styles.heroCard}>
            <Avatar name={user?.name || 'S'} size={72} />
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{user?.name || '—'}</Text>
              <Text style={styles.heroPhone}>{user?.phone ?? '—'}</Text>
              {user?.email ? (
                <Text style={styles.heroEmail}>{user.email}</Text>
              ) : null}
              <View style={[styles.roleBadge, { borderColor: C.background.divider, backgroundColor: C.background.elevated }]}>
                <Text style={[styles.roleBadgeText, { color: C.text.secondary }]}>Shipper</Text>
              </View>
            </View>
          </View>
        )}

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

    content: { padding: Spacing.screenH, gap: 28, paddingBottom: 48 },

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
    heroInfo: { alignItems: 'center', gap: 5 },
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
    heroEmail: {
      fontSize: Typography.sizes.label,
      color: C.text.tertiary,
    },
    roleBadge: {
      marginTop: 6,
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

    // Edit fields — no borders, background colour only
    editFields: { width: '100%', gap: 20 },
    fieldGroup: { gap: 7 },
    fieldLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: '600',
      letterSpacing: 1.2,
      color: C.text.secondary,
    },
    fieldOptional: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: '400',
      color: C.text.tertiary,
      letterSpacing: 0,
      textTransform: 'none',
    },
    fieldInput: {
      height: Components.inputHeight,
      borderRadius: Radius.button,
      backgroundColor: C.background.elevated,
      paddingHorizontal: 14,
      fontSize: Typography.sizes.body,
    },
    fieldDisplay: {
      borderRadius: Radius.button,
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
    section: { gap: Spacing.gap },
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
    menuLabel: { flex: 1, fontSize: Typography.sizes.body, color: C.text.primary },
    menuDivider: { height: StyleSheet.hairlineWidth, marginLeft: 56 },

    signOutBtn: {
      height: Components.buttonHeight,
      borderRadius: Radius.button,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    signOutText: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.medium,
    },
  });
}
