import React, { useEffect, useState, useMemo } from 'react';
import { View, Pressable, FlatList, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { getNotifications } from '@services/mock';
import type { AppNotification } from '@/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const NOTIF_ICONS: Record<AppNotification['type'], IoniconName> = {
  BID_RECEIVED: 'cash-outline',
  MATCH_CONFIRMED: 'flash',
  DRIVER_EN_ROUTE: 'car-outline',
  DELIVERED: 'checkmark-circle',
  SUBSCRIPTION: 'card-outline',
  SYSTEM: 'megaphone-outline',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const notifIconColors: Record<AppNotification['type'], string> = useMemo(() => ({
    BID_RECEIVED: C.status.green,
    MATCH_CONFIRMED: C.accent,
    DRIVER_EN_ROUTE: C.status.blue,
    DELIVERED: C.status.green,
    SUBSCRIPTION: C.text.secondary,
    SYSTEM: C.text.secondary,
  }), [C]);

  useEffect(() => {
    getNotifications('shipper-001').then(setNotifs);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={[styles.notifItem, !item.isRead && styles.notifItemUnread]}>
            <View style={styles.iconWrap}>
              <Ionicons name={NOTIF_ICONS[item.type]} size={20} color={notifIconColors[item.type]} />
            </View>
            <View style={styles.notifContent}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.background.divider }} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications yet</Text>
        }
      />
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56, borderBottomWidth: 1, borderBottomColor: C.background.divider },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    list: {},
    notifItem: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.screenH, gap: Spacing.gap, minHeight: Components.touchMin },
    notifItemUnread: { backgroundColor: 'rgba(245,166,35,0.04)' },
    iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.background.elevated, alignItems: 'center', justifyContent: 'center' },
    notifContent: { flex: 1, gap: 4 },
    notifTitle: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.semibold, color: C.text.primary },
    notifBody: { fontSize: Typography.sizes.chip, color: C.text.secondary, lineHeight: 18 },
    notifTime: { fontSize: Typography.sizes.micro, color: C.text.tertiary, fontVariant: ['tabular-nums'] },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginTop: 4 },
    empty: { textAlign: 'center', color: C.text.tertiary, fontSize: Typography.sizes.body, paddingVertical: 48 },
  });
}
