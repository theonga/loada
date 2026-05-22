import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { TONNAGE_TIERS, TONNAGE_LABELS } from '@constants/index';
import { Spacing } from '@constants/theme';
import { Pill } from './Pill';

interface TonnagePickerProps {
  value: number;
  onChange: (t: number) => void;
}

export function TonnagePicker({ value, onChange }: TonnagePickerProps) {
  return (
    <FlatList
      data={TONNAGE_TIERS as unknown as number[]}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => String(item)}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      renderItem={({ item }) => (
        <Pill active={value === item} onPress={() => onChange(item)}>
          {TONNAGE_LABELS[item]}
        </Pill>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.screenH,
  },
  sep: {
    width: Spacing.gapSm,
  },
});
