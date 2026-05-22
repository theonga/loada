import React, { useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Avatar } from '@components/ui/Avatar';
import { useAuthStore } from '@store/auth.store';
import { MOCK_JOBS } from '@services/mock/data';
import { JobStatus } from '@constants/index';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function ShipperProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const completedJobs = MOCK_JOBS.filter((j) => j.status === JobStatus.COMPLETED).length;
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar name={user?.name ?? 'Shipper'} size={72} />
          <Text style={styles.name}>{user?.name ?? 'Brian Sibanda'}</Text>
          <Text style={styles.phone}>{user?.phone ?? '+263 77 210 0001'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{MOCK_JOBS.length}</Text>
            <Text style={styles.statLabel}>Total jobs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{completedJobs}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {([
            { label: 'Edit profile', icon: 'pencil-outline' as IoniconName, onPress: () => {} },
            { label: 'Notifications', icon: 'notifications-outline' as IoniconName, onPress: () => router.push('/(shared)/notifications') },
            { label: 'Help & support', icon: 'help-circle-outline' as IoniconName, onPress: () => router.push('/(shared)/help') },
            { label: 'Settings', icon: 'settings-outline' as IoniconName, onPress: () => router.push('/(shared)/settings') },
          ]).map(({ label, icon, onPress }) => (
            <Pressable key={label} style={styles.menuItem} onPress={onPress}>
              <Ionicons name={icon} size={20} color={C.text.secondary} />
              <Text style={styles.menuLabel}>{label}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.text.tertiary} />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.logoutBtn}
          onPress={() => { logout(); router.replace('/(auth)'); }}
        >
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    content: { padding: Spacing.screenH, gap: Spacing.section },
    header: { alignItems: 'center', gap: Spacing.gapSm, paddingVertical: 8 },
    name: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    phone: { fontSize: Typography.sizes.body, color: C.text.secondary },
    statsRow: { flexDirection: 'row', backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card },
    stat: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    statLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    statDivider: { width: 1, backgroundColor: C.background.divider },
    menu: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.card, gap: Spacing.gap, minHeight: Components.touchMin, borderBottomWidth: 1, borderBottomColor: C.background.divider },
    menuLabel: { flex: 1, fontSize: Typography.sizes.body, color: C.text.primary },
    logoutBtn: { alignItems: 'center', paddingVertical: 16 },
    logoutText: { fontSize: Typography.sizes.body, color: C.status.red },
  });
}
