import React, { useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Avatar } from '@components/ui/Avatar';
import { Stars } from '@components/ui/Stars';
import { Chip } from '@components/ui/Chip';
import { useAuthStore } from '@store/auth.store';
import { MOCK_DRIVERS, MOCK_SUBSCRIPTION } from '@services/mock/data';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function DriverProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const driver = MOCK_DRIVERS[0];
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const regExpiry = new Date('2026-08-15');
  const isExpiryWarning = regExpiry.getTime() - Date.now() < 60 * 86400000;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar name={user?.name ?? driver.name} size={72} />
          <Text style={styles.name}>{user?.name ?? driver.name}</Text>
          <Stars rating={driver.rating} count={driver.reviewCount} size={14} />
        </View>

        <View style={styles.truckCard}>
          <Text style={styles.cardTitle}>Vehicle</Text>
          <View style={styles.truckRow}>
            <View>
              <Text style={styles.truckModel}>{driver.truckMake} {driver.truckModel} ({driver.truckYear})</Text>
              <Text style={styles.truckReg}>{driver.truckRegistration}</Text>
            </View>
            <Chip variant="amber">{driver.capacityTonnes}t</Chip>
          </View>
        </View>

        <View style={styles.docsCard}>
          <Text style={styles.cardTitle}>Documents</Text>
          {[
            { label: "Driver's licence", status: 'APPROVED', expiry: '2027-03-01', warn: false },
            { label: 'Truck registration', status: 'APPROVED', expiry: '2026-08-15', warn: isExpiryWarning },
          ].map(({ label, status, expiry, warn }) => (
            <View key={label} style={styles.docRow}>
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>{label}</Text>
                <View style={styles.docExpiryRow}>
                  {warn && <Ionicons name="warning-outline" size={12} color={C.status.amber} />}
                  <Text style={[styles.docExpiry, warn && { color: C.status.amber }]}>
                    Expires {expiry}
                  </Text>
                </View>
              </View>
              <Chip variant={status === 'APPROVED' ? 'green' : 'amber'}>{status}</Chip>
            </View>
          ))}
          <Pressable
            style={styles.manageDocsBtn}
            onPress={() => router.push('/(driver)/documents')}
          >
            <Text style={styles.manageDocsBtnText}>Manage documents</Text>
          </Pressable>
        </View>

        <View style={styles.subCard}>
          <Text style={styles.cardTitle}>Subscription</Text>
          <View style={styles.subRow}>
            <Text style={styles.subPlan}>Weekly — $8/wk</Text>
            <Chip variant="green">ACTIVE</Chip>
          </View>
          <Text style={styles.subExpiry}>Renews {new Date(MOCK_SUBSCRIPTION.currentPeriodEnd).toLocaleDateString()}</Text>
        </View>

        <View style={styles.menu}>
          {([
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

        <Pressable style={styles.logoutBtn} onPress={() => { logout(); router.replace('/(auth)'); }}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    content: { padding: Spacing.screenH, gap: Spacing.gap },
    header: { alignItems: 'center', gap: Spacing.gapSm, paddingVertical: 16 },
    name: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    truckCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gapSm },
    cardTitle: { fontSize: Typography.sizes.eyebrow, fontWeight: Typography.weights.semibold, color: C.text.secondary, letterSpacing: 1.2 },
    truckRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    truckModel: { fontSize: Typography.sizes.body, color: C.text.primary, fontWeight: Typography.weights.medium },
    truckReg: { fontSize: Typography.sizes.label, color: C.text.secondary, marginTop: 2 },
    docsCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gap },
    docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    docInfo: { gap: 2 },
    docLabel: { fontSize: Typography.sizes.body, color: C.text.primary },
    docExpiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    docExpiry: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    manageDocsBtn: { alignSelf: 'flex-start' },
    manageDocsBtnText: { fontSize: Typography.sizes.label, color: C.accent },
    subCard: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, padding: Spacing.card, gap: Spacing.gapSm },
    subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subPlan: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.medium, color: C.text.primary },
    subExpiry: { fontSize: Typography.sizes.chip, color: C.text.secondary },
    menu: { backgroundColor: C.background.card, borderRadius: Radius.card, borderWidth: 1, borderColor: C.background.divider, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.card, gap: Spacing.gap, minHeight: Components.touchMin, borderBottomWidth: 1, borderBottomColor: C.background.divider },
    menuLabel: { flex: 1, fontSize: Typography.sizes.body, color: C.text.primary },
    logoutBtn: { alignItems: 'center', paddingVertical: 16 },
    logoutText: { fontSize: Typography.sizes.body, color: C.status.red },
  });
}
