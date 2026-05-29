import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { DARK_MAP_STYLE } from '@components/ui/MapBg';
import { useLocationStore } from '@store/location.store';
import { useEnsureActiveJob } from '@hooks/useEnsureActiveJob';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const result: { latitude: number; longitude: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b = 0, shift = 0, r = 0;
    do { b = encoded.charCodeAt(index++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += r & 1 ? ~(r >> 1) : r >> 1;
    shift = 0; r = 0;
    do { b = encoded.charCodeAt(index++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += r & 1 ? ~(r >> 1) : r >> 1;
    result.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return result;
}

async function fetchRoute(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
): Promise<{ latitude: number; longitude: number }[]> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '';
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&key=${key}`;
  const res = await fetch(url);
  const json = await res.json() as { routes?: Array<{ overview_polyline?: { points: string } }> };
  const points = json.routes?.[0]?.overview_polyline?.points;
  if (points) return decodePolyline(points);
  return [
    { latitude: originLat, longitude: originLng },
    { latitude: destLat, longitude: destLng },
  ];
}

export default function InTransitScreen() {
  const router = useRouter();
  const job = useEnsureActiveJob();
  const driverLoc = useLocationStore((s) => s.driverLocation);
  const setDriverLocation = useLocationStore((s) => s.setDriverLocation);
  const [routePoints, setRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const lastFetchPos = useRef<{ lat: number; lng: number } | null>(null);
  const mapExpandedRef = useRef(mapExpanded);
  mapExpandedRef.current = mapExpanded;
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const distanceKm =
    driverLoc && job
      ? haversineKm(driverLoc.lat, driverLoc.lng, job.destLat, job.destLng)
      : null;
  const etaMin = distanceKm != null ? Math.max(1, Math.round((distanceKm / 60) * 60)) : null;

  // Watch driver's GPS while this screen is mounted — feeds the local store,
  // and the global heartbeat hook will pick it up to push to the server.
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading ?? undefined });
        if (pos.coords.speed != null) setSpeedKmh(Math.max(0, Math.round(pos.coords.speed * 3.6)));
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 6000, distanceInterval: 30 },
          (loc) => {
            setDriverLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude, heading: loc.coords.heading ?? undefined });
            if (loc.coords.speed != null) setSpeedKmh(Math.max(0, Math.round(loc.coords.speed * 3.6)));
          },
        );
      } catch {
        // Permission denied — map renders without live driver dot
      }
    })();
    return () => { sub?.remove(); };
  }, []);

  // Fetch directions from driver → destination, refresh only after 300m of movement
  useEffect(() => {
    if (!job) return;
    const fromLat = driverLoc?.lat ?? job.originLat;
    const fromLng = driverLoc?.lng ?? job.originLng;

    if (
      lastFetchPos.current &&
      haversineKm(fromLat, fromLng, lastFetchPos.current.lat, lastFetchPos.current.lng) < 0.3
    ) return;

    lastFetchPos.current = { lat: fromLat, lng: fromLng };

    fetchRoute(fromLat, fromLng, job.destLat, job.destLng)
      .then((pts) => {
        setRoutePoints(pts);
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(pts, {
            edgePadding: { top: 100, right: 60, bottom: mapExpandedRef.current ? 100 : 320, left: 60 },
            animated: true,
          });
        }, 400);
      })
      .catch(() => {
        lastFetchPos.current = null;
        setRoutePoints([
          { latitude: fromLat, longitude: fromLng },
          { latitude: job.destLat, longitude: job.destLng },
        ]);
      });
  }, [job?.id, driverLoc?.lat, driverLoc?.lng]);

  const handleToggleExpand = () => {
    const next = !mapExpanded;
    setMapExpanded(next);
    setTimeout(() => {
      if (routePoints.length > 0) {
        mapRef.current?.fitToCoordinates(routePoints, {
          edgePadding: { top: 100, right: 60, bottom: next ? 100 : 320, left: 60 },
          animated: true,
        });
      }
    }, 150);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={
          job
            ? {
                latitude: job.destLat,
                longitude: job.destLng,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }
            : undefined
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        {routePoints.length > 0 && (
          <Polyline
            coordinates={routePoints}
            strokeColor={C.accent}
            strokeWidth={3}
          />
        )}

        {/* Live driver marker */}
        {driverLoc && (
          <Marker
            coordinate={{ latitude: driverLoc.lat, longitude: driverLoc.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={driverLoc.heading ?? 0}
            flat
            tracksViewChanges={false}
          >
            <View style={styles.driverDot} />
          </Marker>
        )}

        {/* Destination marker */}
        {job && (
          <Marker
            coordinate={{ latitude: job.destLat, longitude: job.destLng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <Ionicons name="location" size={28} color={C.accent} />
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.appbar} pointerEvents="box-none">
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: C.status.blue }]} />
            <Text style={styles.statusText}>In transit</Text>
          </View>
          <View style={styles.appbarActions}>
            <Pressable style={styles.iconBtn} onPress={handleToggleExpand}>
              <Ionicons
                name={mapExpanded ? 'contract-outline' : 'expand-outline'}
                size={22}
                color={C.text.primary}
              />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => job && router.push(`/(shared)/chat/${job.id}`)}
            >
              <Ionicons name="chatbubble-outline" size={22} color={C.text.primary} />
            </Pressable>
          </View>
        </View>

        {!mapExpanded && (
          <>
            <View style={styles.spacer} pointerEvents="none" />

            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.destination} numberOfLines={2}>{job?.destAddress ?? '—'}</Text>
              <View style={styles.etaRow}>
                <View style={styles.etaItem}>
                  <Text style={styles.etaValue}>
                    {etaMin != null ? etaMin >= 60 ? `${Math.floor(etaMin / 60)}h ${etaMin % 60}m` : `${etaMin}m` : '—'}
                  </Text>
                  <Text style={styles.etaLabel}>ETA</Text>
                </View>
                <View style={styles.etaDivider} />
                <View style={styles.etaItem}>
                  <Text style={styles.etaValue}>
                    {distanceKm != null ? `${distanceKm.toFixed(0)} km` : '—'}
                  </Text>
                  <Text style={styles.etaLabel}>Remaining</Text>
                </View>
                <View style={styles.etaDivider} />
                <View style={styles.etaItem}>
                  <Text style={styles.etaValue}>{speedKmh != null ? `${speedKmh}` : '—'}</Text>
                  <Text style={styles.etaLabel}>km/h</Text>
                </View>
              </View>
              <Pressable
                style={styles.arrivedBtn}
                onPress={() => router.replace('/(driver)/active/complete')}
              >
                <Text style={styles.arrivedBtnText}>I've arrived — complete delivery</Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },
    overlay: { flex: 1 },
    appbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.screenH, paddingVertical: 12, backgroundColor: 'rgba(10,10,10,0.75)' },
    statusBadge: { backgroundColor: C.background.card, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.background.divider, flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: Typography.sizes.label, fontWeight: Typography.weights.medium, color: C.text.primary },
    appbarActions: { flexDirection: 'row', gap: 4 },
    iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    spacer: { flex: 1 },
    sheet: { backgroundColor: C.background.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.card, gap: Spacing.gap },
    handle: { width: 36, height: 4, backgroundColor: C.background.divider, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
    destination: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary, lineHeight: 22 },
    etaRow: { flexDirection: 'row', backgroundColor: C.background.elevated, borderRadius: Radius.inner, padding: 12 },
    etaItem: { flex: 1, alignItems: 'center' },
    etaDivider: { width: 1, backgroundColor: C.background.divider },
    etaValue: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    etaLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary, marginTop: 2 },
    arrivedBtn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    arrivedBtnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
    driverDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.accent, borderWidth: 2, borderColor: '#fff' },
  });
}
