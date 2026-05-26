import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerPushToken } from '@services';
import { useAuthStore } from '@store/auth.store';

/**
 * Registers the Expo push token with the API and wires up the notification
 * response listener for deep-linking. All calls are wrapped in try/catch so
 * the app runs cleanly in Expo Go (which removed remote push in SDK 53).
 *
 * The expo-notifications module is loaded via dynamic import() so that the
 * module-level throw in Expo Go never crashes the app at startup.
 */
export function usePushToken(onNotificationTap?: (type: string, jobId: string) => void) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cleanup: (() => void) | null = null;

    async function register() {
      try {
        const Notifications = await import('expo-notifications');

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        await registerPushToken(tokenData.data).catch(() => {});

        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          try {
            const data = response.notification.request.content.data as Record<string, string> | undefined;
            if (!data || !onNotificationTap) return;
            const { type, jobId } = data;
            if (type && jobId) onNotificationTap(type, jobId);
          } catch {
            // ignore malformed notification data
          }
        });

        cleanup = () => subscription.remove();
      } catch {
        // Non-fatal — Expo Go throws here; app works without push, SMS is the fallback
      }
    }

    register();

    return () => {
      cleanup?.();
    };
  }, [isAuthenticated]);
}
