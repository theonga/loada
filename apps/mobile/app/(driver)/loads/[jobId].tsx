import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { Chip } from '@components/ui/Chip';
import { MapPin } from '@components/ui/MapPin';
import { Skeleton } from '@components/ui/Skeleton';
import { ScreenError } from '@components/ui/ScreenError';
import { DARK_MAP_STYLE } from '@components/ui/MapBg';
import { getJobById } from '@services';
import { isAuthError } from '@services/api';
import { TONNAGE_LABELS, TRUCK_TYPE_LABELS, PAYMENT_METHOD_LABELS, type TruckType, type PaymentMethod } from '@constants/index';
import type { Job } from '@/types';

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

export default function LoadDetailScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [routePoints, setRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mapRef = useRef<MapView | null>(null);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  const load = () => {
    if (!jobId) return;
    setLoading(true);
    setError('');
    getJobById(jobId)
      .then((j) => {
        setJob(j);
        setLoading(false);
        fetchRoute(j.originLat, j.originLng, j.destLat, j.destLng)
          .then((pts) => {
            setRoutePoints(pts);
            setTimeout(() => {
              mapRef.current?.fitToCoordinates(
                [{ latitude: j.originLat, longitude: j.originLng }, { latitude: j.destLat, longitude: j.destLng }],
                { edgePadding: { top: 100, right: 60, bottom: 380, left: 60 }, animated: true },
              );
            }, 400);
          })
          .catch(() => {
            setRoutePoints([
              { latitude: j.originLat, longitude: j.originLng },
              { latitude: j.destLat, longitude: j.destLng },
            ]);
          });
      })
      .catch((err) => { if (!isAuthError(err)) setError((err as Error).message ?? 'Failed to load'); setLoading(false); });
  };

  useEffect(() => { load(); }, [jobId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingBackBtn}>
          <Pressable onPress={() => router.back()} style={styles.backBtnCircle}>
            <Ionicons name="arrow-back" size={20} color={C.text.primary} />
          </Pressable>
        </View>
        <View style={styles.loadingSkeletons}>
          <Skeleton width="40%" height={14} borderRadius={4} />
          <Skeleton width="100%" height={22} borderRadius={4} />
          <Skeleton width="100%" height={22} borderRadius={4} />
          <View style={{ height: Spacing.gap }} />
          <Skeleton width="100%" height={60} borderRadius={12} />
          <Skeleton width="100%" height={52} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenError message={error || 'Load not found'} onRetry={error ? load : undefined} onBack={() => router.back()} />
      </SafeAreaView>
    );
  }

  const origin = { latitude: job.originLat, longitude: job.originLng };
  const dest   = { latitude: job.destLat,   longitude: job.destLng };

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: (job.originLat + job.destLat) / 2,
          longitude: (job.originLng + job.destLng) / 2,
          latitudeDelta: Math.abs(job.destLat - job.originLat) * 1.8 + 0.08,
          longitudeDelta: Math.abs(job.destLng - job.originLng) * 1.8 + 0.08,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor="#F5A623"
            strokeWidth={4}
          />
        )}
        <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <MapPin kind="origin" scale={2} label="Pickup" />
        </Marker>
        <Marker coordinate={dest} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <MapPin kind="dest" scale={2} label="Drop-off" />
        </Marker>
      </MapView>

      {/* Floating back button */}
      <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={styles.backBtnCircle}>
          <Ionicons name="arrow-back" size={20} color={C.text.primary} />
        </Pressable>
      </SafeAreaView>

      {/* Fixed detail panel */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Posted by */}
          {job.shipperName ? (
            <Text style={styles.postedBy}>Posted by {job.shipperName}</Text>
          ) : null}

          {/* Route */}
          <View style={styles.routeSection}>
            <Text style={styles.eyebrow}>ROUTE</Text>
            <View style={styles.routeRow}>
              <View style={styles.routeDotOrigin} />
              <Text style={styles.routeAddr} numberOfLines={2}>{job.originAddress}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <View style={styles.routeDotDest} />
              <Text style={[styles.routeAddr, { color: C.accent }]} numberOfLines={2}>{job.destAddress}</Text>
            </View>
            {(job.distanceKm != null || job.estimatedHours != null) && (
              <View style={styles.routeMeta}>
                {job.distanceKm != null && (
                  <Text style={styles.routeMetaText}>{job.distanceKm} km</Text>
                )}
                {job.distanceKm != null && job.estimatedHours != null && (
                  <Text style={styles.routeMetaDot}>·</Text>
                )}
                {job.estimatedHours != null && (
                  <Text style={styles.routeMetaText}>{job.estimatedHours}h drive</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Cargo */}
          <View style={styles.section}>
            <Text style={styles.eyebrow}>CARGO</Text>
            <Text style={styles.cargoDesc}>{job.cargoDescription}</Text>
            {job.specialRequirements.length > 0 && (
              <View style={styles.chips}>
                {job.specialRequirements.map((r) => (
                  <Chip key={r} variant={r === 'REFRIGERATED' ? 'blue' : 'default'}>{r}</Chip>
                ))}
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Vehicle · Capacity · Payment */}
          <View style={styles.statsStrip}>
            <View style={styles.statItem}>
              <Ionicons name="car-outline" size={18} color={C.text.secondary} />
              <Text style={styles.statValue}>
                {TRUCK_TYPE_LABELS[job.requiredTruckType as TruckType] ?? job.requiredTruckType ?? 'Truck'}
              </Text>
              <Text style={styles.statLabel}>Vehicle</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={18} color={C.text.secondary} />
              <Text style={styles.statValue}>
                {TONNAGE_LABELS[job.requiredTonnes] ?? `${job.requiredTonnes}t`}
              </Text>
              <Text style={styles.statLabel}>Capacity</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="wallet-outline" size={18} color={C.text.secondary} />
              <Text style={styles.statValue}>
                {PAYMENT_METHOD_LABELS[job.paymentMethod as PaymentMethod] ?? job.paymentMethod ?? 'Cash'}
              </Text>
              <Text style={styles.statLabel}>Payment</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Price + bids */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.eyebrow}>ASKING PRICE</Text>
              <Text style={styles.price}>${job.askingPrice}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.bidCount}>{job.bidCount ?? 0}</Text>
              <Text style={styles.bidLabel}>bids so far</Text>
            </View>
          </View>

        </ScrollView>
        <View style={styles.sheetFooter}>
          <Pressable
            style={styles.btn}
            onPress={() => router.push(`/(driver)/bid/${job.id}`)}
          >
            <Text style={styles.btnText}>Place a bid</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background.primary },

    // Loading state
    loadingBackBtn: { padding: Spacing.screenH },
    loadingSkeletons: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: C.background.card,
      borderTopLeftRadius: Components.bottomSheetR,
      borderTopRightRadius: Components.bottomSheetR,
      padding: Spacing.screenH,
      gap: Spacing.gapSm,
      paddingTop: Spacing.section,
    },

    // Back button
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
    backBtnCircle: {
      margin: Spacing.screenH,
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.background.card + 'EE',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: C.background.divider,
    },

    // Fixed bottom sheet panel
    sheet: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: '46%',
      backgroundColor: C.background.card,
      borderTopLeftRadius: Components.bottomSheetR,
      borderTopRightRadius: Components.bottomSheetR,
      paddingTop: Spacing.gapSm,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: Components.handleWidth,
      height: Components.handleHeight,
      borderRadius: 2,
      backgroundColor: C.background.divider,
      marginBottom: Spacing.gapSm,
    },
    sheetContent: { padding: Spacing.screenH, gap: Spacing.gap, paddingBottom: Spacing.gap },

    // Route section
    routeSection: { gap: 6 },
    eyebrow: {
      fontSize: Typography.sizes.eyebrow,
      fontWeight: Typography.weights.semibold,
      color: C.text.tertiary,
      letterSpacing: 1.2,
      marginBottom: 4,
    },
    routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    routeDotOrigin: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff', marginTop: 4, flexShrink: 0 },
    routeDotDest: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent, marginTop: 4, flexShrink: 0 },
    routeLine: { width: 1, height: 16, backgroundColor: C.background.divider, marginLeft: 4.5 },
    routeAddr: { flex: 1, fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary, lineHeight: 22 },
    routeMeta: { flexDirection: 'row', gap: 6, marginTop: 2 },
    routeMetaText: { fontSize: Typography.sizes.chip, color: C.text.secondary, fontVariant: ['tabular-nums'] },
    routeMetaDot: { fontSize: Typography.sizes.chip, color: C.text.tertiary },

    divider: { height: 1, backgroundColor: C.background.divider },

    // Cargo section
    section: { gap: Spacing.gapSm },
    cargoDesc: { fontSize: Typography.sizes.body, color: C.text.primary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

    // Posted by
    postedBy: { fontSize: Typography.sizes.label, color: C.text.secondary },

    // Stats strip
    statsStrip: {
      flexDirection: 'row',
      backgroundColor: C.background.elevated,
      borderRadius: Radius.inner,
      padding: 12,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statDivider: { width: 1, backgroundColor: C.background.divider },
    statValue: {
      fontSize: Typography.sizes.label,
      fontWeight: Typography.weights.semibold,
      color: C.text.primary,
      textAlign: 'center',
    },
    statLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary },

    // Price section
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    price: { fontSize: Typography.sizes.price, fontWeight: Typography.weights.bold, color: C.accent, fontVariant: ['tabular-nums'], marginTop: 2 },
    bidCount: { fontSize: Typography.sizes.cardTitle, fontWeight: Typography.weights.bold, color: C.text.primary, fontVariant: ['tabular-nums'] },
    bidLabel: { fontSize: Typography.sizes.chip, color: C.text.secondary },

    // Sticky footer + CTA
    sheetFooter: {
      paddingHorizontal: Spacing.screenH,
      paddingVertical: Spacing.gap,
      borderTopWidth: 1,
      borderTopColor: C.background.divider,
    },
    btn: { height: Components.buttonHeight, backgroundColor: C.accent, borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center' },
    btnText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },
  });
}
