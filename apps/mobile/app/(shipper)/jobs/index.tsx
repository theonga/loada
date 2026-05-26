import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing } from '@constants/theme';
import { LoadCard } from '@components/ui/LoadCard';
import { Skeleton } from '@components/ui/Skeleton';
import { getShipperJobs } from '@services';
import { useAuthStore } from '@store/auth.store';
import { JobStatus } from '@constants/index';
import type { Job } from '@/types';

export default function ShipperJobsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    getShipperJobs(user?.id ?? '')
      .then((data) => { setJobs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.title}>My Jobs</Text>
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={100} borderRadius={12} />)}
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LoadCard
              job={item}
              onPress={() => {
                if (item.status === JobStatus.BIDDING || item.status === JobStatus.POSTED) {
                  router.push(`/(shipper)/bids/${item.id}`);
                } else if (
                  item.status === JobStatus.DELIVERED ||
                  item.status === JobStatus.COMPLETED
                ) {
                  router.push(`/(shipper)/delivery/${item.id}`);
                } else {
                  router.push(`/(shipper)/tracking/${item.id}`);
                }
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No jobs yet. Post your first load!</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { paddingHorizontal: Spacing.screenH, paddingVertical: 16 },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    skeletons: { padding: Spacing.screenH, gap: Spacing.gap },
    list: { padding: Spacing.screenH, gap: Spacing.gap },
    sep: { height: Spacing.gap },
    empty: { textAlign: 'center', color: C.text.tertiary, fontSize: Typography.sizes.body, paddingVertical: 48 },
  });
}
