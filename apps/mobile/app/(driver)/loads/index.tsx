import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { LoadCard } from '@components/ui/LoadCard';
import { Skeleton } from '@components/ui/Skeleton';
import { getAvailableLoads, getDriverActiveJobs } from '@services';
import { useAuthStore } from '@store/auth.store';
import { JobStatus } from '@constants/index';
import type { Job } from '@/types';

type TabKey = 'AVAILABLE' | 'ACTIVE' | 'HISTORY';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'ACTIVE', label: 'My Active' },
  { key: 'HISTORY', label: 'History' },
];

const IN_PROGRESS_STATUSES: JobStatus[] = [
  JobStatus.MATCHED,
  JobStatus.PICKUP_EN_ROUTE,
  JobStatus.PICKUP_ARRIVED,
  JobStatus.LOADED,
  JobStatus.IN_TRANSIT,
  JobStatus.DELIVERED,
];

const HISTORY_STATUSES: JobStatus[] = [
  JobStatus.COMPLETED,
  JobStatus.CANCELLED,
];

export default function DriverLoadsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [availableLoads, setAvailableLoads] = useState<Job[]>([]);
  const [driverJobs, setDriverJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('AVAILABLE');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [avail, myJobs] = await Promise.all([
        getAvailableLoads(user?.id ?? ''),
        getDriverActiveJobs(user?.id ?? ''),
      ]);
      setAvailableLoads(avail);
      setDriverJobs(myJobs);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Unknown error';
      setError(`Could not load: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const displayedJobs = useMemo(() => {
    if (activeTab === 'AVAILABLE') return availableLoads;
    if (activeTab === 'ACTIVE') return driverJobs.filter((j) => IN_PROGRESS_STATUSES.includes(j.status));
    if (activeTab === 'HISTORY') return driverJobs.filter((j) => HISTORY_STATUSES.includes(j.status));
    return [];
  }, [activeTab, availableLoads, driverJobs]);

  const countFor = (tab: TabKey) => {
    if (tab === 'AVAILABLE') return availableLoads.length;
    if (tab === 'ACTIVE') return driverJobs.filter((j) => IN_PROGRESS_STATUSES.includes(j.status)).length;
    if (tab === 'HISTORY') return driverJobs.filter((j) => HISTORY_STATUSES.includes(j.status)).length;
    return 0;
  };

  const emptyText = () => {
    if (activeTab === 'AVAILABLE') return 'No loads available near you right now.';
    if (activeTab === 'ACTIVE') return 'No active jobs. Pick up a load to get started.';
    return 'No completed or cancelled jobs yet.';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Loads</Text>
        {activeTab === 'AVAILABLE' && (
          <Text style={styles.sub}>{availableLoads.length} near you</Text>
        )}
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
        style={styles.tabBar}
      >
        {TABS.map((tab) => {
          const count = countFor(tab.key);
          const active = activeTab === tab.key;
          const hasAlert = tab.key === 'ACTIVE' && count > 0;
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
                <View style={[styles.tabBadge, active && styles.tabBadgeActive, hasAlert && styles.tabBadgeAlert]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive, hasAlert && styles.tabBadgeTextAlert]}>
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
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={displayedJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LoadCard
              job={item}
              onPress={() => {
                if (activeTab === 'AVAILABLE') {
                  router.push(`/(driver)/loads/${item.id}`);
                } else if (IN_PROGRESS_STATUSES.includes(item.status)) {
                  router.push(`/(driver)/active/en-route`);
                } else {
                  router.push(`/(driver)/loads/${item.id}`);
                }
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.gap }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{emptyText()}</Text>
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
    tabBadgeAlert: {
      backgroundColor: 'rgba(0,200,83,0.15)',
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
    tabBadgeTextAlert: {
      color: C.status.green,
    },

    skeletons: { padding: Spacing.screenH, gap: Spacing.gap },
    list: { padding: Spacing.screenH },
    empty: { flex: 1, paddingTop: 64, alignItems: 'center' },
    emptyText: { textAlign: 'center', color: C.text.tertiary, fontSize: Typography.sizes.body },
    errorText: { textAlign: 'center', color: C.status.red, fontSize: Typography.sizes.body, paddingVertical: 48 },
  });
}
