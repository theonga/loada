import React, { useState, useEffect, useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { Avatar } from '@components/ui/Avatar';
import { Chip } from '@components/ui/Chip';
import { Skeleton } from '@components/ui/Skeleton';
import { getJobById, getDriverProfile, submitRating } from '@services';
import type { DriverProfile } from '@/types';

const RATING_TAGS = ['ON_TIME', 'CAREFUL_WITH_CARGO', 'PROFESSIONAL', 'GOOD_COMMUNICATION'];

export default function RateDriverScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  useEffect(() => {
    if (!jobId) return;
    getJobById(jobId)
      .then((job) => {
        if (job.matchedDriverId) {
          return getDriverProfile(job.matchedDriverId);
        }
        return null;
      })
      .then((d) => { if (d) setDriver(d); })
      .catch(() => {});
  }, [jobId]);

  const toggleTag = (tag: string) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    if (!driver) return;
    setLoading(true);
    try {
      await submitRating(jobId ?? '', driver.userId, score, tags, comment || undefined);
      router.replace('/(shipper)');
    } catch {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.text.primary} />
        </Pressable>
        <Text style={styles.title}>Rate your driver</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.driverCard}>
          {driver ? (
            <>
              <Avatar name={driver.name} size={64} />
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.truckInfo}>{driver.truckMake} {driver.truckModel}</Text>
            </>
          ) : (
            <>
              <Skeleton width={64} height={64} borderRadius={32} />
              <Skeleton width={120} height={18} borderRadius={4} />
              <Skeleton width={80} height={14} borderRadius={4} />
            </>
          )}
        </View>

        {/* Star rating */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable key={s} onPress={() => setScore(s)} style={styles.starBtn}>
              <Ionicons
                name={s <= score ? 'star' : 'star-outline'}
                size={36}
                color={s <= score ? C.accent : C.background.divider}
              />
            </Pressable>
          ))}
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {RATING_TAGS.map((tag) => (
            <Pressable key={tag} onPress={() => toggleTag(tag)}>
              <Chip variant={tags.includes(tag) ? 'amber' : 'default'}>
                {tag.replace(/_/g, ' ')}
              </Chip>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.comment}
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment (optional)"
          placeholderTextColor={C.text.tertiary}
          multiline
          numberOfLines={3}
        />

        <View style={styles.spacer} />

        <Pressable style={[styles.btn, (!driver || loading) && { opacity: 0.5 }]} onPress={handleSubmit} disabled={!driver || loading}>
          <Text style={styles.btnText}>{loading ? 'Submitting…' : 'Submit rating'}</Text>
        </Pressable>

        <Pressable style={styles.skip} onPress={() => router.replace('/(shipper)')}>
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, height: 56 },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary },
    content: { flex: 1, padding: Spacing.screenH, gap: Spacing.gap },
    driverCard: { alignItems: 'center', gap: 8, paddingVertical: 16 },
    driverName: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.semibold, color: C.text.primary },
    truckInfo: { fontSize: Typography.sizes.label, color: C.text.secondary },
    starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
    starBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.gapSm },
    comment: {
      backgroundColor: C.background.elevated, borderRadius: Radius.button,
      borderWidth: 1, borderColor: C.background.divider,
      padding: 14, color: C.text.primary, fontSize: Typography.sizes.body,
      minHeight: 80, textAlignVertical: 'top',
    },
    spacer: { flex: 1 },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    skip: { alignItems: 'center', height: Components.touchMin, justifyContent: 'center' },
    skipText: { fontSize: Typography.sizes.label, color: C.text.tertiary },
  });
}
