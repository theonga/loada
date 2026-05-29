import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { getSocket } from '@services/socket';
import { useLocationStore } from '@store/location.store';
import { useAuthStore } from '@store/auth.store';
import { useJobStore } from '@store/job.store';

const INTERVAL_MS = 8000;

const ACTIVE_JOB_STATUSES = new Set([
  'MATCHED',
  'PICKUP_EN_ROUTE',
  'PICKUP_ARRIVED',
  'LOADED',
  'IN_TRANSIT',
]);

/**
 * Pushes driver GPS to the server every 8s on the /location namespace.
 *
 * Fires when EITHER the driver toggles themselves online (browsing for loads)
 * OR they have an active job — the shipper's tracking screen must keep updating
 * even if the driver's online toggle is off.
 */
export function useDriverHeartbeat() {
  const isOnline = useLocationStore((s) => s.isOnline);
  const setDriverLocation = useLocationStore((s) => s.setDriverLocation);
  const role = useAuthStore((s) => s.role);
  const activeJobStatus = useJobStore((s) => s.activeJob?.status ?? null);
  const hasActiveJob = activeJobStatus != null && ACTIVE_JOB_STATUSES.has(activeJobStatus);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const shouldTrack = role === 'driver' && (isOnline || hasActiveJob);
    if (!shouldTrack) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const socket = getSocket('/location');
      if (socket.connected) socket.disconnect();
      return;
    }

    let active = true;

    async function requestPermission() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    }

    async function sendLocation() {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!active) return;
        const { latitude, longitude, heading, speed } = loc.coords;
        setDriverLocation({ lat: latitude, lng: longitude, heading: heading ?? undefined });
        const socket = getSocket('/location');
        if (!socket.connected) socket.connect();
        socket.emit('location:update', {
          lat: latitude,
          lng: longitude,
          heading: heading ?? undefined,
          speed: speed != null ? Math.round(speed * 3.6) : undefined, // m/s → km/h
        });
      } catch {
        // location unavailable — skip this tick, try again next interval
      }
    }

    requestPermission().then((granted) => {
      if (!granted || !active) return;
      sendLocation();
      intervalRef.current = setInterval(sendLocation, INTERVAL_MS);
    });

    return () => {
      active = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, role, hasActiveJob]);
}
