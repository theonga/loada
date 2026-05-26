import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, Typography, Spacing, Radius, Components } from '@constants/theme';
import { COUNTRIES, Country } from '@constants/countries';

interface CountryPickerProps {
  value: Country;
  onChange: (country: Country) => void;
}

export function CountryPicker({ value, onChange }: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const C = useColors();

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  function select(country: Country) {
    onChange(country);
    setOpen(false);
    setQuery('');
  }

  return (
    <>
      <Pressable
        style={[styles(C).trigger]}
        onPress={() => setOpen(true)}
        accessibilityLabel={`Country: ${value.name} ${value.dial}`}
      >
        <Text style={styles(C).flag}>{value.flag}</Text>
        <Text style={styles(C).dial}>{value.dial}</Text>
        <Ionicons name="chevron-down" size={14} color={C.text.secondary} />
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles(C).sheet} edges={['top', 'bottom']}>
          <View style={styles(C).header}>
            <Text style={styles(C).headerTitle}>Select country</Text>
            <Pressable onPress={() => { setOpen(false); setQuery(''); }} style={styles(C).closeBtn}>
              <Ionicons name="close" size={22} color={C.text.primary} />
            </Pressable>
          </View>

          <View style={styles(C).searchRow}>
            <Ionicons name="search" size={16} color={C.text.tertiary} style={{ marginLeft: 12 }} />
            <TextInput
              style={styles(C).searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code…"
              placeholderTextColor={C.text.tertiary}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(c) => c.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[styles(C).row, item.code === value.code && styles(C).rowSelected]}
                onPress={() => select(item)}
              >
                <Text style={styles(C).rowFlag}>{item.flag}</Text>
                <Text style={styles(C).rowName}>{item.name}</Text>
                <Text style={styles(C).rowDial}>{item.dial}</Text>
                {item.code === value.code && (
                  <Ionicons name="checkmark" size={16} color={C.accent} />
                )}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = (C: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button,
      borderWidth: 1,
      borderColor: C.background.divider,
      paddingHorizontal: 12,
      height: Components.inputHeight,
    },
    flag: { fontSize: 20 },
    dial: { color: C.text.primary, fontSize: Typography.sizes.body, fontWeight: '500', fontVariant: ['tabular-nums'] },
    sheet: { flex: 1, backgroundColor: C.background.primary },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenH, paddingVertical: 16 },
    headerTitle: { fontSize: Typography.sizes.body, fontWeight: '600', color: C.text.primary },
    closeBtn: { width: Components.touchMin, height: Components.touchMin, alignItems: 'center', justifyContent: 'center' },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.background.elevated, borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider, marginHorizontal: Spacing.screenH, marginBottom: 8 },
    searchInput: { flex: 1, height: Components.inputHeight, paddingHorizontal: 10, color: C.text.primary, fontSize: Typography.sizes.body },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenH, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.background.divider },
    rowSelected: { backgroundColor: 'rgba(245,166,35,0.06)' },
    rowFlag: { fontSize: 22 },
    rowName: { flex: 1, fontSize: Typography.sizes.body, color: C.text.primary },
    rowDial: { fontSize: Typography.sizes.body, color: C.text.secondary, fontVariant: ['tabular-nums'] },
  });
