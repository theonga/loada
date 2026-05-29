import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, FlatList, Pressable, ScrollView, StyleSheet, RefreshControl, AppState } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { LoadCard } from '@components/ui/LoadCard';
import { Skeleton } from '@components/ui/Skeleton';
import { getAvailableLoads, getDriverActiveJobs, getMyDriverProfile, getMyBids } from '@services';
import { isAuthError } from '@services/api';
import { useAuthStore } from '@store/auth.store';
import { useJobStore } from '@store/job.store';
import { JobStatus, BidStatus } from '@constants/index';
import { getSocket } from '@services/socket';
import type { Job, Bid, DriverProfile } from '@/types';

type TabKey = 'AVAILABLE' | 'BIDS' | 'ACTIVE' | 'HISTORY';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'AVAILABLE', label: 'Available' },
  { key: 'BIDS', label: 'My Bids' },
  { key: 'ACTIVE', label: 'Active' },
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
  JobStatus.EXPIRED,
];

export default function DriverLoadsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setActiveJob = useJobStore((s) => s.setActiveJob);
  const [availableLoads, setAvailableLoads] = useState<Job[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [driverJobs, setDriverJobs] = useState<Job[]>([]);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('AVAILABLE');
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [avail, myJobs, profile, bids] = await Promise.all([
        getAvailableLoads(user?.id ?? ''),
        getDriverActiveJobs(user?.id ?? ''),
        getMyDriverProfile(),
        getMyBids(),
      ]);

      // Filter available loads to exclude jobs the driver has already bid on
      const biddedJobIds = new Set(bids.map((b) => b.jobId));
      setAvailableLoads(avail.filter((j) => !biddedJobIds.has(j.id)));
      setMyBids(bids);
      setDriverJobs(myJobs);
      setDriverProfile(profile);
    } catch (err: unknown) {
      if (isAuthError(err)) return;
      const msg = (err as { message?: string })?.message ?? 'Unknown error';
      setError(`Could not load: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // Refresh available loads instantly when a new load is broadcast via Socket.IO
  useEffect(() => {
    const socket = getSocket('/jobs');
    if (!socket.connected) socket.connect();
    const onNewLoad = () => loadData();
    socket.on('job:new_load', onNewLoad);
    return () => { socket.off('job:new_load', onNewLoad); };
  }, [loadData]);

  // Refresh when app comes back to foreground — catches delayed FCM deliveries
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadData();
    });
    return () => sub.remove();
  }, [loadData]);

  const displayedJobs = useMemo(() => {
    if (activeTab === 'AVAILABLE') return availableLoads;
    if (activeTab === 'ACTIVE') return driverJobs.filter((j) => IN_PROGRESS_STATUSES.includes(j.status));
    if (activeTab === 'HISTORY') return driverJobs.filter((j) => HISTORY_STATUSES.includes(j.status));
    return [];
  }, [activeTab, availableLoads, driverJobs]);

  // For BIDS tab we render from myBids (which carry the job inside)
  const displayedBids = useMemo(() => activeTab === 'BIDS' ? myBids : [], [activeTab, myBids]);

  const countFor = (tab: TabKey) => {
    if (tab === 'AVAILABLE') return availableLoads.length;
    if (tab === 'BIDS') return myBids.length;
    if (tab === 'ACTIVE') return driverJobs.filter((j) => IN_PROGRESS_STATUSES.includes(j.status)).length;
    if (tab === 'HISTORY') return driverJobs.filter((j) => HISTORY_STATUSES.includes(j.status)).length;
    return 0;
  };

  const emptyText = () => {
    if (activeTab === 'AVAILABLE') return 'No loads available near you right now.';
    if (activeTab === 'BIDS') return "You haven't placed any bids yet.";
    if (activeTab === 'ACTIVE') return 'No active jobs. Pick up a load to get started.';
    return 'No completed or cancelled jobs yet.';
  };

  const profileIncomplete = !loading && driverProfile && driverProfile.truckMake === 'Unknown';

  if (profileIncomplete) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.appbar}>
          <Text style={styles.title}>Loads</Text>
        </View>
        <View style={styles.setupGate}>
          <Ionicons name="car-outline" size={48} color={C.text.tertiary} />
          <Text style={styles.setupTitle}>Set up your vehicle first</Text>
          <Text style={styles.setupSub}>
            Add your truck details and load capacity so we can show you the right loads.
          </Text>
          <Pressable style={styles.setupBtn} onPress={() => router.push('/(auth)/driver-setup/vehicle')}>
            <Text style={styles.setupBtnText}>Set up vehicle</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          const hasBidsAlert = tab.key === 'BIDS' && count > 0;
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
                <View style={[
                  styles.tabBadge,
                  active && styles.tabBadgeActive,
                  hasAlert && styles.tabBadgeAlert,
                  hasBidsAlert && styles.tabBadgeBids,
                ]}>
                  <Text style={[
                    styles.tabBadgeText,
                    active && styles.tabBadgeTextActive,
                    hasAlert && styles.tabBadgeTextAlert,
                    hasBidsAlert && styles.tabBadgeTextBids,
                  ]}>
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
      ) : activeTab === 'BIDS' ? (
        <FlatList
          data={displayedBids}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={C.accent} />}
          renderItem={({ item }) =>
            item.job ? (
              <LoadCard
                job={item.job}
                myBidPrice={item.offeredPrice}
                onPress={
                  item.status === BidStatus.EXPIRED
                    ? () => {}
                    : () => router.push(`/(driver)/bid/pending/${item.id}?jobId=${item.jobId}`)
                }
              />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.gap }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{emptyText()}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={displayedJobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={C.accent} />}
          renderItem={({ item }) => (
            <LoadCard
              job={item}
              onPress={() => {
                if (activeTab === 'AVAILABLE') {
                  router.push(`/(driver)/loads/${item.id}`);
                } else if (IN_PROGRESS_STATUSES.includes(item.status)) {
                  setActiveJob(item);
                  router.push('/(driver)/active/en-route');
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
    tabBadgeActive: { backgroundColor: 'rgba(245,166,35,0.20)' },
    tabBadgeAlert: { backgroundColor: 'rgba(0,200,83,0.15)' },
    tabBadgeBids: { backgroundColor: 'rgba(245,166,35,0.15)' },
    tabBadgeText: {
      fontSize: 10,
      fontWeight: Typography.weights.bold,
      color: C.text.tertiary,
      fontVariant: ['tabular-nums'],
    },
    tabBadgeTextActive: { color: C.accent },
    tabBadgeTextAlert: { color: C.status.green },
    tabBadgeTextBids: { color: C.accent },

    skeletons: { padding: Spacing.screenH, gap: Spacing.gap },
    list: { padding: Spacing.screenH, paddingBottom: Spacing.section },
    empty: { flex: 1, paddingTop: 64, alignItems: 'center' },
    emptyText: { textAlign: 'center', color: C.text.tertiary, fontSize: Typography.sizes.body },
    errorText: { textAlign: 'center', color: C.status.red, fontSize: Typography.sizes.body, paddingVertical: 48 },
    setupGate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenH, gap: Spacing.gap },
    setupTitle: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary, textAlign: 'center' },
    setupSub: { fontSize: Typography.sizes.body, color: C.text.secondary, textAlign: 'center', lineHeight: 22 },
    setupBtn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: Spacing.gapSm },
    setupBtnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
