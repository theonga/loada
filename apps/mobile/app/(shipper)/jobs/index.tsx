import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { LoadCard } from '@components/ui/LoadCard';
import { Skeleton } from '@components/ui/Skeleton';
import { getShipperJobs } from '@services';
import { useAuthStore } from '@store/auth.store';
import { JobStatus } from '@constants/index';
import type { Job } from '@/types';

type TabKey = 'ALL' | 'BIDDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'BIDDING', label: 'Bidding' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const ACTIVE_STATUSES: JobStatus[] = [
  JobStatus.MATCHED,
  JobStatus.PICKUP_EN_ROUTE,
  JobStatus.PICKUP_ARRIVED,
  JobStatus.LOADED,
  JobStatus.IN_TRANSIT,
  JobStatus.DELIVERED,
];

const BIDDING_STATUSES: JobStatus[] = [
  JobStatus.POSTED,
  JobStatus.BIDDING,
  JobStatus.RADIUS_EXPANDED,
];

export default function ShipperJobsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShipperJobs(user?.id ?? '');
      setJobs(data);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return jobs;
    if (activeTab === 'BIDDING') return jobs.filter((j) => BIDDING_STATUSES.includes(j.status));
    if (activeTab === 'ACTIVE') return jobs.filter((j) => ACTIVE_STATUSES.includes(j.status));
    if (activeTab === 'COMPLETED') return jobs.filter((j) => j.status === JobStatus.COMPLETED);
    if (activeTab === 'CANCELLED') return jobs.filter((j) => j.status === JobStatus.CANCELLED);
    return jobs;
  }, [jobs, activeTab]);

  const countFor = (tab: TabKey) => {
    if (tab === 'ALL') return jobs.length;
    if (tab === 'BIDDING') return jobs.filter((j) => BIDDING_STATUSES.includes(j.status)).length;
    if (tab === 'ACTIVE') return jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)).length;
    if (tab === 'COMPLETED') return jobs.filter((j) => j.status === JobStatus.COMPLETED).length;
    if (tab === 'CANCELLED') return jobs.filter((j) => j.status === JobStatus.CANCELLED).length;
    return 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.title}>My Jobs</Text>
        <Text style={styles.sub}>{jobs.length} total</Text>
      </View>

      {/* Status filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
        style={styles.tabBar}
      >
        {TABS.map((tab) => {
          const count = countFor(tab.key);
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              hitSlop={4}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={100} borderRadius={12} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LoadCard
              job={item}
              onPress={() => {
                if (BIDDING_STATUSES.includes(item.status)) {
                  router.push(`/(shipper)/bids/${item.id}`);
                } else if (item.status === JobStatus.DELIVERED || item.status === JobStatus.COMPLETED) {
                  router.push(`/(shipper)/delivery/${item.id}`);
                } else {
                  router.push(`/(shipper)/tracking/${item.id}`);
                }
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {activeTab === 'ALL' ? 'No jobs yet. Post your first load!' : `No ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} jobs.`}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 4 },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    sub: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2 },

    tabBar: { flexGrow: 0 },
    tabScroll: { paddingHorizontal: Spacing.screenH, paddingVertical: 12, gap: Spacing.gapSm },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: Components.pillHeight,
      paddingHorizontal: 14,
      borderRadius: Radius.pill,
      backgroundColor: C.background.elevated,
      borderWidth: 1,
      borderColor: C.background.divider,
    },
    tabActive: {
      backgroundColor: 'rgba(245,166,35,0.12)',
      borderColor: 'rgba(245,166,35,0.35)',
    },
    tabLabel: {
      fontSize: Typography.sizes.chip,
      fontWeight: Typography.weights.medium,
      color: C.text.secondary,
    },
    tabLabelActive: {
      color: C.accent,
      fontWeight: Typography.weights.semibold,
    },
    tabBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: C.background.divider,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    tabBadgeActive: {
      backgroundColor: 'rgba(245,166,35,0.20)',
    },
    tabBadgeText: {
      fontSize: 10,
      fontWeight: Typography.weights.bold,
      color: C.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    tabBadgeTextActive: {
      color: C.accent,
    },

    skeletons: { padding: Spacing.screenH, gap: Spacing.gap },
    list: { padding: Spacing.screenH, gap: Spacing.gap },
    sep: { height: Spacing.gap },
    empty: { flex: 1, paddingTop: 64, alignItems: 'center' },
    emptyText: { textAlign: 'center', color: C.text.tertiary, fontSize: Typography.sizes.body },
  });
}
