import React, { useRef } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TONNAGE_TIERS, TONNAGE_LABELS } from '@constants/index';
import { Spacing } from '@constants/theme';
import { Pill } from './Pill';

interface TonnagePickerProps {
  value: number;
  onChange: (t: number) => void;
}

export function TonnagePicker({ value, onChange }: TonnagePickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const tiers = TONNAGE_TIERS as unknown as number[];

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {tiers.map((item, idx) => (
        <View
          key={String(item)}
          style={idx > 0 ? styles.gap : undefined}
          onLayout={(e) => {
            if (item === value && e.nativeEvent.layout.x > 0) {
              scrollRef.current?.scrollTo({
                x: Math.max(0, e.nativeEvent.layout.x - Spacing.screenH),
                animated: false,
              });
            }
          }}
        >
          <Pill active={value === item} onPress={() => onChange(item)}>
            {TONNAGE_LABELS[item]}
          </Pill>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {},
  gap: { marginLeft: Spacing.gapSm },
});
