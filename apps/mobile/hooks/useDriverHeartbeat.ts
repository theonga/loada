import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { getSocket } from '@services/socket';
import { useLocationStore } from '@store/location.store';
import { useAuthStore } from '@store/auth.store';

const INTERVAL_MS = 8000;

/**
 * When the driver is online, acquires GPS and sends location:update to the
 * /location namespace every 8 seconds. Stops when offline or unmounted.
 * Also registers driver presence on the /jobs namespace for matching queries.
 */
export function useDriverHeartbeat() {
  const isOnline = useLocationStore((s) => s.isOnline);
  const setDriverLocation = useLocationStore((s) => s.setDriverLocation);
  const role = useAuthStore((s) => s.role);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (role !== 'driver' || !isOnline) {
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
  }, [isOnline, role]);
}
