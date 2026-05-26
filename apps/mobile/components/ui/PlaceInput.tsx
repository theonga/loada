import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Radius, Components } from '@constants/theme';

export interface SelectedPlace {
  address: string;
  lat: number;
  lng: number;
}

interface PlaceInputProps {
  label?: string;
  placeholder: string;
  value: string;
  onPress: () => void;
  onClear: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  active?: boolean;
}

export function PlaceInput({
  label,
  placeholder,
  value,
  onPress,
  onClear,
  icon,
  iconColor,
  active = false,
}: PlaceInputProps) {
  const C = useColors();

  return (
    <View>
      {label ? (
        <Text style={[s.label, { color: C.text.secondary }]}>{label}</Text>
      ) : null}

      <Pressable
        style={[
          s.wrap,
          {
            backgroundColor: C.background.elevated,
            borderColor: active ? C.accent : C.background.divider,
          },
        ]}
        onPress={onPress}
      >
        {icon ? (
          <Ionicons name={icon} size={16} color={iconColor ?? C.text.secondary} />
        ) : null}

        <Text
          style={[s.valueText, { color: value ? C.text.primary : C.text.tertiary }]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        {value.length > 0 ? (
          <Pressable
            onPress={(e) => { e.stopPropagation(); onClear(); }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={C.text.tertiary} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={C.text.tertiary} />
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.button,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: Components.inputHeight,
    gap: 8,
  },
  valueText: {
    flex: 1,
    fontSize: Typography.sizes.body,
  },
});
