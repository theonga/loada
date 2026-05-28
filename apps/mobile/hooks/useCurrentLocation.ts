import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface CurrentLocation {
  lat: number;
  lng: number;
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {
        // Fall through — screens use their default region
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { location, loading };
}
