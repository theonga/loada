import React, { useEffect, useState, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Components } from '@constants/theme';
import { LoadCard } from '@components/ui/LoadCard';
import { Skeleton } from '@components/ui/Skeleton';
import { getAvailableLoads } from '@services/mock';
import type { Job } from '@/types';

export default function DriverLoadsScreen() {
  const router = useRouter();
  const [loads, setLoads] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    getAvailableLoads('dp-001').then((data) => {
      setLoads(data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appbar}>
        <Text style={styles.title}>Available loads</Text>
        <Text style={styles.sub}>{loads.length} near you</Text>
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={100} borderRadius={12} />)}
        </View>
      ) : (
        <FlatList
          data={loads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LoadCard
              job={item}
              onPress={() => router.push(`/(driver)/loads/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.gap }} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No loads available near you right now.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { paddingHorizontal: Spacing.screenH, paddingTop: 16, paddingBottom: 8 },
    title: { fontSize: Typography.sizes.screenTitle, fontWeight: Typography.weights.bold, color: C.text.primary },
    sub: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2 },
    skeletons: { padding: Spacing.screenH, gap: Spacing.gap },
    list: { padding: Spacing.screenH },
    empty: { textAlign: 'center', color: C.text.tertiary, fontSize: Typography.sizes.body, paddingVertical: 48 },
  });
}
