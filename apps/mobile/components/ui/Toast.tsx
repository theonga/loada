/**
 * App-wide custom toast.
 *
 * Mount <ToastHost /> once at the root layout. Call showToast / showToastError /
 * showToastSuccess / showToastInfo from anywhere — including async handlers.
 *
 * Toasts auto-dismiss after `duration` ms (default 2500) and slide in from the
 * top below the status bar. Tap a toast to dismiss early.
 */

import React, { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { create } from 'zustand';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useColors, Typography, Radius } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastConfig {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number;
}

interface ShowToastOpts {
  variant?: ToastVariant;
  duration?: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ToastStore {
  queue: ToastConfig[];
  push: (config: ToastConfig) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  queue: [],
  push: (config) => set((s) => ({ queue: [...s.queue, config] })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
}));

let nextId = 1;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Show a toast notification. Returns the toast ID so callers can dismiss it
 * early via `dismissToast(id)` if needed.
 */
export function showToast(message: string, opts: ShowToastOpts = {}): number {
  const id = nextId++;
  useToastStore.getState().push({
    id,
    variant: opts.variant ?? 'info',
    message,
    duration: opts.duration ?? 2500,
  });
  return id;
}

export const showToastSuccess = (msg: string, opts?: ShowToastOpts) => showToast(msg, { ...opts, variant: 'success' });
export const showToastError   = (msg: string, opts?: ShowToastOpts) => showToast(msg, { ...opts, variant: 'error' });
export const showToastWarning = (msg: string, opts?: ShowToastOpts) => showToast(msg, { ...opts, variant: 'warning' });
export const showToastInfo    = (msg: string, opts?: ShowToastOpts) => showToast(msg, { ...opts, variant: 'info' });

export function dismissToast(id: number) {
  useToastStore.getState().dismiss(id);
}

// ─── Host component — mount once in root layout ───────────────────────────────

export function ToastHost() {
  const queue = useToastStore((s) => s.queue);
  const insets = useSafeAreaInsets();

  if (queue.length === 0) return null;

  return (
    // pointerEvents="box-none" lets touches pass through the empty space around
    // the toast stack so the UI underneath stays interactive.
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        // 8px gap below the status bar/notch on iOS; Android already has the
        // safe area insets baked in.
        { top: insets.top + (Platform.OS === 'android' ? 8 : 4) },
      ]}
    >
      {queue.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
}

// ─── Single toast row ─────────────────────────────────────────────────────────

function ToastItem({ toast }: { toast: ToastConfig }) {
  const C = useColors();
  const dismiss = useToastStore((s) => s.dismiss);
  const anim = useRef(new Animated.Value(0)).current;

  // Animate in on mount, schedule auto-dismiss, animate out and remove
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => dismiss(toast.id));
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, anim, dismiss]);

  const handleTap = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => dismiss(toast.id));
  };

  const palette: Record<ToastVariant, { icon: React.ComponentProps<typeof Ionicons>['name']; iconColor: string; border: string; bg: string }> = {
    info:    { icon: 'information-circle', iconColor: C.status.blue,  border: 'rgba(33,150,243,0.30)', bg: 'rgba(33,150,243,0.10)' },
    success: { icon: 'checkmark-circle',   iconColor: C.status.green, border: 'rgba(0,200,83,0.30)',  bg: 'rgba(0,200,83,0.10)' },
    warning: { icon: 'warning',            iconColor: C.status.amber, border: 'rgba(255,179,0,0.30)', bg: 'rgba(255,179,0,0.10)' },
    error:   { icon: 'alert-circle',       iconColor: C.status.red,   border: 'rgba(244,67,54,0.30)', bg: 'rgba(244,67,54,0.10)' },
  };
  const p = palette[toast.variant];

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });
  const opacity = anim;

  return (
    <Animated.View
      style={[
        styles.toastWrap,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Pressable
        onPress={handleTap}
        style={[
          styles.toast,
          {
            backgroundColor: C.background.card,
            borderColor: p.border,
          },
        ]}
      >
        <View style={[styles.iconBubble, { backgroundColor: p.bg }]}>
          <Ionicons name={p.icon} size={18} color={p.iconColor} />
        </View>
        <Text style={[styles.message, { color: C.text.primary }]} numberOfLines={3}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toastWrap: {
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.medium,
    lineHeight: 19,
  },
});
