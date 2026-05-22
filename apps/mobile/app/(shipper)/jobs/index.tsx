import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing } from '@constants/theme';
import { LoadCard } from '@components/ui/LoadCard';
import { MOCK_JOBS } from '@services/mock/data';
import { JobStatus } from '@constants/index';

export default function ShipperJobsScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.title}>My Jobs</Text>
      </View>
      <FlatList
        data={MOCK_JOBS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <LoadCard
            job={item}
            onPress={() => {
              if (item.status === JobStatus.BIDDING) {
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
          <Text style={styles.empty}>No jobs yet. Post your first load!</Text>
        }
      />
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { paddingHorizontal: Spacing.screenH, paddingVertical: 16 },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    list: { padding: Spacing.screenH, gap: Spacing.gap },
    sep: { height: Spacing.gap },
    empty: { textAlign: 'center', color: C.text.tertiary, fontSize: Typography.sizes.body, paddingVertical: 48 },
  });
}
