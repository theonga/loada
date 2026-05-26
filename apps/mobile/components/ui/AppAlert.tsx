/**
 * App-wide custom alert system.
 *
 * Mount <AppAlertHost /> once at the root layout.
 * Call showAlert / showError / showConfirm from anywhere — including async handlers.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Modal, Pressable, StyleSheet,
  Animated, ActivityIndicator,
} from 'react-native';
import { create } from 'zustand';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Typography, Radius } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'default' | 'accent' | 'destructive';
type IconVariant = 'default' | 'accent' | 'destructive';

export interface AlertButton {
  label: string;
  variant?: ButtonVariant;
  onPress?: () => void | Promise<void>;
}

export interface AlertConfig {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconVariant?: IconVariant;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AlertStore {
  queue: AlertConfig[];
  push: (config: AlertConfig) => void;
  shift: () => void;
}

const useAlertStore = create<AlertStore>((set) => ({
  queue: [],
  push: (config) => set((s) => ({ queue: [...s.queue, config] })),
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
}));

// ─── Public API ───────────────────────────────────────────────────────────────

/** Show any custom alert. */
export function showAlert(config: AlertConfig) {
  useAlertStore.getState().push(config);
}

/** One-button error dialog. */
export function showError(message: string, title = 'Something went wrong') {
  showAlert({
    icon: 'alert-circle-outline',
    iconVariant: 'destructive',
    title,
    message,
    buttons: [{ label: 'OK', variant: 'accent' }],
  });
}

/** Two-button confirmation dialog. */
export function showConfirm(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  showAlert({
    icon: opts.destructive ? 'warning-outline' : 'help-circle-outline',
    iconVariant: opts.destructive ? 'destructive' : 'default',
    title: opts.title,
    message: opts.message,
    buttons: [
      { label: 'Cancel', variant: 'default', onPress: opts.onCancel },
      {
        label: opts.confirmLabel ?? 'Confirm',
        variant: opts.destructive ? 'destructive' : 'accent',
        onPress: opts.onConfirm,
      },
    ],
  });
}

/** Hook — gives components named access to all helpers. */
export function useAppAlert() {
  return { showAlert, showError, showConfirm };
}

// ─── Host component — mount once in root layout ───────────────────────────────

export function AppAlertHost() {
  const queue = useAlertStore((s) => s.queue);
  const shift = useAlertStore((s) => s.shift);
  const config = queue[0] ?? null;

  const C = useColors();
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // Open/close animation tied to queue head
  useEffect(() => {
    if (config) {
      setLoadingIdx(null);
      setVisible(true);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 11,
      }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        setVisible(false);
      });
    }
  }, [config]);                     // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePress(btn: AlertButton, idx: number) {
    if (loadingIdx !== null) return;
    setLoadingIdx(idx);
    try {
      await btn.onPress?.();
    } finally {
      setLoadingIdx(null);
      shift();
    }
  }

  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const cardScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  const iconBg: Record<IconVariant, string> = {
    default:     C.background.elevated,
    accent:      'rgba(245,166,35,0.12)',
    destructive: 'rgba(244,67,54,0.12)',
  };
  const iconColor: Record<IconVariant, string> = {
    default:     C.text.secondary,
    accent:      C.accent,
    destructive: C.status.red,
  };
  const btnColor: Record<ButtonVariant, string> = {
    default:     C.text.secondary,
    accent:      C.accent,
    destructive: C.status.red,
  };

  const buttons = config?.buttons ?? [];
  const singleBtn = buttons.length === 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => { if (loadingIdx === null) shift(); }}
    >
      {/* Backdrop */}
      <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]} />

      {/* Card */}
      <View style={s.centeredView}>
        <Animated.View
          style={[
            s.card,
            {
              backgroundColor: C.background.card,
              borderColor: C.background.divider,
              opacity: anim,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Icon */}
          {config?.icon ? (
            <View style={[s.iconWrap, { backgroundColor: iconBg[config.iconVariant ?? 'default'] }]}>
              <Ionicons
                name={config.icon}
                size={22}
                color={iconColor[config.iconVariant ?? 'default']}
              />
            </View>
          ) : null}

          {/* Title */}
          <Text style={[s.title, { color: C.text.primary }]}>
            {config?.title ?? ''}
          </Text>

          {/* Message */}
          {config?.message ? (
            <Text style={[s.message, { color: C.text.secondary }]}>
              {config.message}
            </Text>
          ) : null}

          {/* Buttons */}
          <View style={[s.btnRow, { borderTopColor: C.background.divider }]}>
            {buttons.map((btn, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <View style={[s.btnDivider, { backgroundColor: C.background.divider }]} />
                )}
                <Pressable
                  style={({ pressed }) => [
                    s.btn,
                    singleBtn && s.btnFull,
                    pressed && { backgroundColor: 'rgba(255,255,255,0.04)' },
                  ]}
                  onPress={() => handlePress(btn, idx)}
                  disabled={loadingIdx !== null}
                >
                  {loadingIdx === idx ? (
                    <ActivityIndicator size="small" color={btnColor[btn.variant ?? 'default']} />
                  ) : (
                    <Text
                      style={[
                        s.btnText,
                        { color: btnColor[btn.variant ?? 'default'] },
                        (btn.variant === 'accent' || btn.variant === 'destructive') && s.btnTextBold,
                      ]}
                    >
                      {btn.label}
                    </Text>
                  )}
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 28,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  message: {
    fontSize: Typography.sizes.label,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
    lineHeight: 20,
  },
  btnRow: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 24,
    width: '100%',
    minHeight: 52,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 8,
  },
  btnFull: {
    flex: 1,
  },
  btnDivider: {
    width: StyleSheet.hairlineWidth,
  },
  btnText: {
    fontSize: Typography.sizes.body,
    fontWeight: '400',
  },
  btnTextBold: {
    fontWeight: '600',
  },
});
