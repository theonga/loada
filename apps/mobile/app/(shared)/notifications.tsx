import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Pressable, FlatList, StyleSheet, SectionList } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { getNotifications, getShipperJobs, getDriverActiveJobs } from '@services';
import { useAuthStore } from '@store/auth.store';
import { JobStatus } from '@constants/index';
import type { AppNotification, Job } from '@/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type ChatItem = { kind: 'chat'; job: Job };
type NotifItem = { kind: 'notif'; notif: AppNotification };
type ListItem = ChatItem | NotifItem;

const NOTIF_ICONS: Record<AppNotification['type'], IoniconName> = {
  BID_RECEIVED: 'cash-outline',
  MATCH_CONFIRMED: 'flash',
  DRIVER_EN_ROUTE: 'car-outline',
  DELIVERED: 'checkmark-circle',
  WALLET: 'wallet-outline',
  SYSTEM: 'megaphone-outline',
};

const CHAT_STATUSES: JobStatus[] = [
  JobStatus.MATCHED,
  JobStatus.PICKUP_EN_ROUTE,
  JobStatus.PICKUP_ARRIVED,
  JobStatus.LOADED,
  JobStatus.IN_TRANSIT,
  JobStatus.DELIVERED,
  JobStatus.COMPLETED,
];

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [chatJobs, setChatJobs] = useState<Job[]>([]);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const notifIconColors: Record<AppNotification['type'], string> = useMemo(() => ({
    BID_RECEIVED: C.status.green,
    MATCH_CONFIRMED: C.accent,
    DRIVER_EN_ROUTE: C.status.blue,
    DELIVERED: C.status.green,
    WALLET: C.accent,
    SYSTEM: C.text.secondary,
  }), [C]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [n, jobs] = await Promise.all([
      getNotifications(user.id).catch(() => [] as AppNotification[]),
      user.role === 'DRIVER'
        ? getDriverActiveJobs(user.id).catch(() => [] as Job[])
        : getShipperJobs(user.id).catch(() => [] as Job[]),
    ]);
    setNotifs(n);
    setChatJobs(jobs.filter((j) => CHAT_STATUSES.includes(j.status as JobStatus)));
  }, [user]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const sections = useMemo((): { title: string; data: ListItem[] }[] => {
    const result: { title: string; data: ListItem[] }[] = [];
    if (chatJobs.length > 0) {
      result.push({ title: 'MESSAGES', data: chatJobs.map((j): ChatItem => ({ kind: 'chat', job: j })) });
    }
    if (notifs.length > 0) {
      result.push({ title: 'ACTIVITY', data: notifs.map((n): NotifItem => ({ kind: 'notif', notif: n })) });
    }
    return result;
  }, [chatJobs, notifs]);

  const isDriver = user?.role === 'DRIVER';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="notifications-outline" size={48} color={C.text.tertiary} />
          <Text style={styles.emptyText}>Nothing here yet</Text>
        </View>
      ) : (
        <SectionList<ListItem>
          sections={sections}
          keyExtractor={(item, i) => (item.kind === 'chat' ? item.job.id : item.notif.id) + i}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            if (item.kind === 'chat') {
              const job = item.job;
              const otherName = isDriver ? job.shipperName : (job.matchedDriverName ?? 'Driver');
              const route = `${job.originAddress.split(',')[0]} → ${job.destAddress.split(',')[0]}`;
              return (
                <Pressable
                  style={({ pressed }) => [styles.chatRow, pressed && { backgroundColor: C.background.elevated }]}
                  onPress={() => router.push(`/(shared)/chat/${job.id}`)}
                >
                  <View style={styles.chatIcon}>
                    <Ionicons name="chatbubble-outline" size={20} color={C.accent} />
                  </View>
                  <View style={styles.chatContent}>
                    <Text style={styles.chatName} numberOfLines={1}>{otherName}</Text>
                    <Text style={styles.chatRoute} numberOfLines={1}>{route}</Text>
                  </View>
                  <Text style={styles.chatTime}>{timeAgo(job.updatedAt)}</Text>
                </Pressable>
              );
            }

            const notif = item.notif;
            return (
              <Pressable style={[styles.notifItem, !notif.isRead && styles.notifItemUnread]}>
                <View style={styles.iconWrap}>
                  <Ionicons name={NOTIF_ICONS[notif.type]} size={20} color={notifIconColors[notif.type]} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                  <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
                </View>
                {!notif.isRead && <View style={styles.unreadDot} />}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.background.divider }} />}
          SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: {
      paddingHorizontal: Spacing.screenH,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.background.divider,
    },
    title: {
      fontSize: Typography.sizes.screenTitle,
      fontWeight: Typography.weights.bold,
      color: C.text.primary,
    },
    list: { paddingBottom: 40 },
    sectionLabel: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: Typography.weights.semibold,
      color: C.text.tertiary,
      letterSpacing: 1.2,
      paddingHorizontal: Spacing.screenH,
      paddingTop: 20,
      paddingBottom: 6,
    },

    // Chat rows
    chatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.screenH,
      paddingVertical: 14,
      gap: Spacing.gap,
      minHeight: Components.touchMin,
    },
    chatIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(245,166,35,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatContent: { flex: 1, gap: 3 },
    chatName: {
      fontSize: Typography.sizes.body,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    chatRoute: {
      fontSize: Typography.sizes.chip,
      color: C.text.secondary,
    },
    chatTime: {
      fontSize: Typography.sizes.micro,
      color: C.text.tertiary,
      fontVariant: ['tabular-nums'],
    },

    // Notification rows
    notifItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: Spacing.screenH,
      paddingVertical: 14,
      gap: Spacing.gap,
      minHeight: Components.touchMin,
    },
    notifItemUnread: { backgroundColor: 'rgba(245,166,35,0.04)' },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.background.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notifContent: { flex: 1, gap: 4 },
    notifTitle: {
      fontSize: Typography.sizes.label,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
    },
    notifBody: { fontSize: Typography.sizes.chip, color: C.text.secondary, lineHeight: 18 },
    notifTime: { fontSize: Typography.sizes.micro, color: C.text.tertiary, fontVariant: ['tabular-nums'] },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginTop: 4 },

    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyText: { fontSize: Typography.sizes.body, color: C.text.tertiary },
  });
}
