import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Pressable, FlatList, StyleSheet,
  ActivityIndicator, Platform, Keyboard, Animated,
} from 'react-native';
import { TextInput } from '@components/ui/TextInput';
import type { TextInput as NativeTextInput } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@components/ui/Text';
import { PlaceInput, type SelectedPlace } from '@components/ui/PlaceInput';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, ColorPalette, Typography, Spacing, Radius, Components } from '@constants/theme';
import { ProgressBar } from '@components/ui/ProgressBar';
import { useDraftJobStore } from '@store/draftJob.store';
import { getPlaceSuggestions, getPlaceDetails, reverseGeocodePlace, getFrequentLocations, type PlacePrediction, type FrequentLocation } from '@services';
import { useCurrentLocation } from '@hooks/useCurrentLocation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function fitRegion(a: { lat: number; lng: number }, b: { lat: number; lng: number } | null) {
  if (!b) return { latitude: a.lat, longitude: a.lng, latitudeDelta: 0.06, longitudeDelta: 0.04 };
  const latDelta = Math.max(Math.abs(a.lat - b.lat) * 1.6, 0.06);
  const lngDelta = Math.max(Math.abs(a.lng - b.lng) * 1.6, 0.04);
  return {
    latitude: (a.lat + b.lat) / 2,
    longitude: (a.lng + b.lng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
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

function useDebounce<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
];

const HARARE = { latitude: -17.8252, longitude: 31.0335, latitudeDelta: 0.15, longitudeDelta: 0.12 };
const isExpoGo = Constants.appOwnership === 'expo';
const MAP_PROVIDER = Platform.OS === 'android' && isExpoGo ? PROVIDER_DEFAULT : PROVIDER_GOOGLE;

type SearchTarget = 'pickup' | 'dropoff' | null;
type PinTarget = 'pickup' | 'dropoff' | null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostRouteScreen() {
  const router = useRouter();
  const setRoute = useDraftJobStore((s) => s.setRoute);
  const draft = useDraftJobStore((s) => s.draft);
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const { top: safeTop, bottom: safeBottom } = useSafeAreaInsets();

  const mapRef = useRef<MapView>(null);
  const searchInputRef = useRef<NativeTextInput>(null);
  const [sessiontoken] = useState(randomToken);

  // Overlay slide-up animation
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Bottom card keyboard avoidance
  const kbOffset = useRef(new Animated.Value(0)).current;
  const [kbVisible, setKbVisible] = useState(false);

  // Search state
  const [searchTarget, setSearchTarget] = useState<SearchTarget>(null);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectingPlace, setSelectingPlace] = useState(false);

  // Pin-on-map state
  const [pinTarget, setPinTarget] = useState<PinTarget>(null);
  const [pinRegion, setPinRegion] = useState(HARARE);
  const [confirmingPin, setConfirmingPin] = useState(false);

  // Route polyline
  const [routePoints, setRoutePoints] = useState<{ latitude: number; longitude: number }[]>([]);

  // Selected places
  const [pickupText, setPickupText] = useState(draft.origin?.address?.split(',')[0] ?? '');
  const [dropoffText, setDropoffText] = useState(draft.dest?.address?.split(',')[0] ?? '');
  const [pickupPlace, setPickupPlace] = useState<SelectedPlace | null>(
    draft.origin?.address ? { address: draft.origin.address, lat: draft.origin.lat, lng: draft.origin.lng } : null,
  );
  const [dropoffPlace, setDropoffPlace] = useState<SelectedPlace | null>(
    draft.dest?.address ? { address: draft.dest.address, lat: draft.dest.lat, lng: draft.dest.lng } : null,
  );

  // Frequent locations
  const [frequentLocs, setFrequentLocs] = useState<{ pickups: FrequentLocation[]; dropoffs: FrequentLocation[] }>({
    pickups: [],
    dropoffs: [],
  });

  useEffect(() => {
    getFrequentLocations().then(setFrequentLocs).catch(() => undefined);
  }, []);

  // Current location — center map on first open if no draft route set
  const { location: currentLocation } = useCurrentLocation();
  useEffect(() => {
    if (!currentLocation || pickupPlace || dropoffPlace) return;
    mapRef.current?.animateToRegion(
      { latitude: currentLocation.lat, longitude: currentLocation.lng, latitudeDelta: 0.08, longitudeDelta: 0.06 },
      600,
    );
  // only run when currentLocation first resolves
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]);

  // Keyboard listeners for bottom card
  useEffect(() => {
    const showE = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showE, (e) => {
      setKbVisible(true);
      Animated.timing(kbOffset, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener(hideE, (e) => {
      setKbVisible(false);
      Animated.timing(kbOffset, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, [kbOffset]);

  // Animate map and fetch route when places change
  useEffect(() => {
    if (!pickupPlace && !dropoffPlace) { setRoutePoints([]); return; }

    if (pickupPlace && dropoffPlace) {
      // Fetch driving route, then fit both markers into view
      fetchRoute(pickupPlace.lat, pickupPlace.lng, dropoffPlace.lat, dropoffPlace.lng)
        .then((pts) => {
          setRoutePoints(pts);
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(
              [
                { latitude: pickupPlace.lat, longitude: pickupPlace.lng },
                { latitude: dropoffPlace.lat, longitude: dropoffPlace.lng },
              ],
              { edgePadding: { top: 120, right: 40, bottom: 300, left: 40 }, animated: true },
            );
          }, 200);
        })
        .catch(() => {
          setRoutePoints([]);
          const region = fitRegion(
            { lat: pickupPlace.lat, lng: pickupPlace.lng },
            { lat: dropoffPlace.lat, lng: dropoffPlace.lng },
          );
          mapRef.current?.animateToRegion(region, 400);
        });
    } else {
      // Only one place set — clear route and pan to it
      setRoutePoints([]);
      const place = pickupPlace ?? dropoffPlace!;
      const region = fitRegion({ lat: place.lat, lng: place.lng }, null);
      mapRef.current?.animateToRegion(region, 400);
    }
  }, [pickupPlace, dropoffPlace]);

  // Suggestions fetch
  const debouncedSearch = useDebounce(searchText, 300);
  useEffect(() => {
    if (debouncedSearch.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    setLoadingSuggestions(true);
    getPlaceSuggestions(debouncedSearch, sessiontoken)
      .then((r) => { if (!cancelled) setSuggestions(r.slice(0, 6)); })
      .catch(() => { if (!cancelled) setSuggestions([]); })
      .finally(() => { if (!cancelled) setLoadingSuggestions(false); });
    return () => { cancelled = true; };
  }, [debouncedSearch, sessiontoken]);

  // Open search overlay
  const openSearch = useCallback((target: 'pickup' | 'dropoff') => {
    setSearchTarget(target);
    setSearchText(target === 'pickup' ? pickupText : dropoffText);
    setSuggestions([]);
    Animated.spring(overlayAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }).start(() => {
      searchInputRef.current?.focus();
    });
  }, [pickupText, dropoffText, overlayAnim]);

  // Close search overlay
  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSearchTarget(null);
      setSearchText('');
      setSuggestions([]);
    });
  }, [overlayAnim]);

  // Handle suggestion tap
  const handleSuggestionSelect = useCallback(async (pred: PlacePrediction) => {
    setSelectingPlace(true);
    Keyboard.dismiss();
    try {
      const place = await getPlaceDetails(pred.placeId, sessiontoken);
      if (searchTarget === 'pickup') {
        setPickupText(place.address.split(',')[0]);
        setPickupPlace(place);
      } else {
        setDropoffText(place.address.split(',')[0]);
        setDropoffPlace(place);
      }
      closeSearch();
    } catch { /* keep text */ }
    finally { setSelectingPlace(false); }
  }, [searchTarget, sessiontoken, closeSearch]);

  // Handle frequent location tap — lat/lng already known, no Places API call needed
  const handleFrequentSelect = useCallback((loc: FrequentLocation) => {
    const place: SelectedPlace = { address: loc.address, lat: loc.lat, lng: loc.lng };
    if (searchTarget === 'pickup') {
      setPickupText(loc.address.split(',')[0]);
      setPickupPlace(place);
    } else {
      setDropoffText(loc.address.split(',')[0]);
      setDropoffPlace(place);
    }
    closeSearch();
  }, [searchTarget, closeSearch]);

  // Enter pin-pick mode
  const enterPinMode = useCallback((target: 'pickup' | 'dropoff') => {
    closeSearch();
    setPinTarget(target);
    // Center map on existing place or Harare
    const existing = target === 'pickup' ? pickupPlace : dropoffPlace;
    if (existing) {
      mapRef.current?.animateToRegion(
        { latitude: existing.lat, longitude: existing.lng, latitudeDelta: 0.04, longitudeDelta: 0.03 },
        300,
      );
    }
  }, [closeSearch, pickupPlace, dropoffPlace]);

  // Confirm pin location
  const confirmPin = useCallback(async () => {
    if (!pinTarget) return;
    setConfirmingPin(true);
    try {
      const address = await reverseGeocodePlace(pinRegion.latitude, pinRegion.longitude);
      const place: SelectedPlace = { address, lat: pinRegion.latitude, lng: pinRegion.longitude };
      if (pinTarget === 'pickup') {
        setPickupText(address.split(',')[0]);
        setPickupPlace(place);
      } else {
        setDropoffText(address.split(',')[0]);
        setDropoffPlace(place);
      }
    } catch { /* ignore */ }
    finally {
      setConfirmingPin(false);
      setPinTarget(null);
    }
  }, [pinTarget, pinRegion]);

  const canContinue = !!pickupPlace && !!dropoffPlace;

  function handleContinue() {
    if (!pickupPlace || !dropoffPlace) return;
    setRoute(
      { address: pickupPlace.address, lat: pickupPlace.lat, lng: pickupPlace.lng },
      { address: dropoffPlace.address, lat: dropoffPlace.lat, lng: dropoffPlace.lng },
    );
    router.push('/(shipper)/post/cargo');
  }

  // Overlay translate
  const overlayTranslate = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [800, 0],
  });

  // Frequent locations for the current search target
  const activeFrequentLocs = searchTarget === 'pickup' ? frequentLocs.pickups : frequentLocs.dropoffs;
  const showFrequent = searchText.length < 2 && activeFrequentLocs.length > 0;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Full-screen map */}
      <MapView
        ref={mapRef}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFillObject}
        initialRegion={HARARE}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        onRegionChangeComplete={(r) => setPinRegion(r)}
      >
        {routePoints.length > 1 && !pinTarget && (
          <Polyline
            coordinates={routePoints}
            strokeColor="#F5A623"
            strokeWidth={3}
          />
        )}
        {pickupPlace && !pinTarget && (
          <Marker coordinate={{ latitude: pickupPlace.lat, longitude: pickupPlace.lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <View style={styles.markerOrigin}><View style={styles.markerDot} /></View>
          </Marker>
        )}
        {dropoffPlace && !pinTarget && (
          <Marker coordinate={{ latitude: dropoffPlace.lat, longitude: dropoffPlace.lng }} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
            <View style={styles.markerDest}><View style={styles.markerDotAccent} /></View>
          </Marker>
        )}
      </MapView>

      {/* ── PIN MODE ── crosshair + confirm bar */}
      {pinTarget && (
        <>
          {/* Fixed crosshair in the center of the screen */}
          <View style={styles.crosshairWrap} pointerEvents="none">
            <View style={styles.crosshairV} />
            <View style={styles.crosshairH} />
            <View style={styles.crosshairDot} />
          </View>

          {/* Pin mode footer */}
          <SafeAreaView style={styles.pinFooter} edges={['bottom']}>
            <View style={styles.pinHint}>
              <Ionicons name="information-circle-outline" size={14} color={C.text.secondary} />
              <Text style={styles.pinHintText}>
                Drag the map to position the {pinTarget === 'pickup' ? 'pickup' : 'dropoff'} pin
              </Text>
            </View>
            <View style={styles.pinActions}>
              <Pressable style={styles.pinCancel} onPress={() => setPinTarget(null)}>
                <Text style={styles.pinCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.pinConfirm, confirmingPin && { opacity: 0.6 }]}
                onPress={confirmPin}
                disabled={confirmingPin}
              >
                {confirmingPin
                  ? <ActivityIndicator size="small" color={C.background.primary} />
                  : <Text style={styles.pinConfirmText}>Confirm location</Text>
                }
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Pin mode header */}
          <SafeAreaView style={styles.pinHeader} edges={['top']}>
            <Pressable style={styles.closeBtn} onPress={() => setPinTarget(null)}>
              <Ionicons name="close" size={22} color={C.text.primary} />
            </Pressable>
            <Text style={styles.pinHeaderTitle}>
              {pinTarget === 'pickup' ? 'Set pickup' : 'Set dropoff'}
            </Text>
            <View style={{ width: 44 }} />
          </SafeAreaView>
        </>
      )}

      {/* ── NORMAL MODE ── header + bottom card */}
      {!pinTarget && (
        <>
          <SafeAreaView style={styles.headerSafe} edges={['top']}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={C.text.primary} />
              </Pressable>
              <Text style={styles.step}>1 / 4</Text>
              <View style={{ width: 44 }} />
            </View>
            <ProgressBar pct={25} />
          </SafeAreaView>

          <Animated.View
            style={[styles.card, { bottom: kbOffset, paddingBottom: kbVisible ? 16 : safeBottom + 16 }]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Route</Text>

            <View style={styles.routeRow}>
              <View style={styles.connector}>
                <View style={styles.connectorDotWhite} />
                <View style={styles.connectorLine} />
                <View style={styles.connectorDotAccent} />
              </View>

              <View style={styles.inputsCol}>
                <PlaceInput
                  label="PICKUP"
                  placeholder="Pickup location"
                  value={pickupText}
                  onPress={() => openSearch('pickup')}
                  onClear={() => { setPickupText(''); setPickupPlace(null); }}
                  icon="location-outline"
                  active={false}
                />
                <PlaceInput
                  label="DROPOFF"
                  placeholder="Dropoff location"
                  value={dropoffText}
                  onPress={() => openSearch('dropoff')}
                  onClear={() => { setDropoffText(''); setDropoffPlace(null); }}
                  icon="navigate-outline"
                  iconColor={C.accent}
                  active={false}
                />
              </View>
            </View>

            <Pressable
              style={[styles.btn, !canContinue && styles.btnDisabled]}
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text style={styles.btnText}>Continue →</Text>
            </Pressable>
          </Animated.View>
        </>
      )}

      {/* ── SEARCH OVERLAY ── full-screen, slides up */}
      {searchTarget && (
        <Animated.View
          style={[
            styles.overlay,
            { transform: [{ translateY: overlayTranslate }] },
          ]}
        >
          {/* Header */}
          <View style={[styles.overlayHeader, { paddingTop: safeTop + 8 }]}>
            <Pressable style={styles.overlayBack} onPress={closeSearch}>
              <Ionicons name="arrow-back" size={22} color={C.text.primary} />
            </Pressable>

            <View style={[styles.overlayInputWrap, { borderColor: C.accent }]}>
              <Ionicons
                name={searchTarget === 'pickup' ? 'location-outline' : 'navigate-outline'}
                size={16}
                color={searchTarget === 'pickup' ? C.text.secondary : C.accent}
              />
              <TextInput
                inputRef={searchInputRef}
                style={[styles.overlayInput, { color: C.text.primary }]}
                value={searchText}
                onChangeText={(t) => setSearchText(t)}
                placeholder={searchTarget === 'pickup' ? 'Search pickup location' : 'Search dropoff location'}
                placeholderTextColor={C.text.tertiary}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
              />
              {searchText.length > 0 && (
                <Pressable onPress={() => setSearchText('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={C.text.tertiary} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Eyebrow label */}
          <Text style={[styles.overlayLabel, { color: C.text.tertiary }]}>
            {searchTarget === 'pickup' ? 'PICKUP LOCATION' : 'DROPOFF LOCATION'}
          </Text>

          {/* Pin on map option */}
          <Pressable
            style={[styles.pinRow, { borderColor: C.background.divider }]}
            onPress={() => enterPinMode(searchTarget)}
          >
            <View style={[styles.pinRowIcon, { backgroundColor: 'rgba(245,166,35,0.12)' }]}>
              <Ionicons name="map-outline" size={18} color={C.accent} />
            </View>
            <Text style={[styles.pinRowText, { color: C.text.primary }]}>Pin on map</Text>
            <Ionicons name="chevron-forward" size={16} color={C.text.tertiary} />
          </Pressable>

          <View style={[styles.dividerRow, { backgroundColor: C.background.divider }]} />

          {/* Frequent locations — shown before user starts typing */}
          {showFrequent && (
            <>
              <Text style={[styles.freqEyebrow, { color: C.text.tertiary }]}>FREQUENT</Text>
              {activeFrequentLocs.map((loc, i) => (
                <Pressable
                  key={`freq-${i}`}
                  style={[
                    styles.freqRow,
                    i < activeFrequentLocs.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.background.divider },
                  ]}
                  onPress={() => handleFrequentSelect(loc)}
                >
                  <View style={[styles.freqIcon, { backgroundColor: C.background.elevated }]}>
                    <Ionicons name="time-outline" size={15} color={C.text.secondary} />
                  </View>
                  <View style={styles.freqTexts}>
                    <Text style={[styles.freqMain, { color: C.text.primary }]} numberOfLines={1}>
                      {loc.address.split(',')[0]}
                    </Text>
                    {loc.address.split(',').slice(1).join(',').trim() ? (
                      <Text style={[styles.freqSub, { color: C.text.secondary }]} numberOfLines={1}>
                        {loc.address.split(',').slice(1, 3).join(',').trim()}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.freqCount, { color: C.text.tertiary, fontVariant: ['tabular-nums'] }]}>
                    {loc.count}×
                  </Text>
                </Pressable>
              ))}
              <View style={[styles.dividerRow, { backgroundColor: C.background.divider, marginTop: 4 }]} />
            </>
          )}

          {/* Suggestion results */}
          {loadingSuggestions ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={C.text.tertiary} />
            </View>
          ) : selectingPlace ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={C.accent} />
              <Text style={[styles.loadingText, { color: C.text.secondary }]}>Getting location…</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.suggestionList}
              ListEmptyComponent={
                searchText.length >= 2 ? null : (
                  <View style={styles.emptyHint}>
                    <Text style={[styles.emptyHintText, { color: C.text.tertiary }]}>
                      Start typing to search
                    </Text>
                  </View>
                )
              }
              renderItem={({ item, index }) => (
                <Pressable
                  style={[
                    styles.suggestionRow,
                    index < suggestions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.background.divider },
                  ]}
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <View style={[styles.suggestionIcon, { backgroundColor: C.background.elevated }]}>
                    <Ionicons name="location-outline" size={15} color={C.accent} />
                  </View>
                  <View style={styles.suggestionTexts}>
                    <Text style={[styles.suggestionMain, { color: C.text.primary }]} numberOfLines={1}>
                      {item.mainText}
                    </Text>
                    {item.secondaryText ? (
                      <Text style={[styles.suggestionSub, { color: C.text.secondary }]} numberOfLines={1}>
                        {item.secondaryText}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background.primary },

    // Header
    headerSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.screenH, height: 56,
      backgroundColor: 'rgba(10,10,10,0.75)',
    },
    closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    step: { fontSize: Typography.sizes.label, color: C.text.secondary, fontVariant: ['tabular-nums'] },

    // Map markers
    markerOrigin: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: C.background.elevated, borderWidth: 2, borderColor: C.text.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    markerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.text.primary },
    markerDest: {
      width: 24, height: 24, borderRadius: 4,
      backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    },
    markerDotAccent: { width: 8, height: 8, borderRadius: 2, backgroundColor: C.background.primary },

    // Bottom card
    card: {
      position: 'absolute', left: 0, right: 0,
      backgroundColor: C.background.card,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: Spacing.screenH,
      paddingTop: 12,
      gap: Spacing.gap,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: C.background.divider, alignSelf: 'center', marginBottom: 4,
    },
    title: {
      fontSize: Typography.sizes.screenTitle,
      fontWeight: Typography.weights.bold,
      color: C.text.primary, letterSpacing: -0.4,
    },
    routeRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    connector: { width: 18, alignItems: 'center', paddingTop: 34 },
    connectorDotWhite: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.text.primary, marginBottom: 6 },
    connectorLine: { width: 1, height: 32, backgroundColor: C.background.divider },
    connectorDotAccent: { width: 10, height: 10, borderRadius: 2, backgroundColor: C.accent, marginTop: 6 },
    inputsCol: { flex: 1, gap: Spacing.gap },
    btn: {
      height: Components.buttonHeight, backgroundColor: C.accent,
      borderRadius: Radius.button, alignItems: 'center', justifyContent: 'center',
      marginTop: 4,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: {
      fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold,
      color: C.background.primary,
    },

    // Pin mode
    crosshairWrap: {
      position: 'absolute', top: '50%', left: '50%',
      width: 0, height: 0,
      alignItems: 'center', justifyContent: 'center',
    },
    crosshairV: {
      position: 'absolute',
      width: 2, height: 28,
      backgroundColor: C.accent,
      top: -14,
    },
    crosshairH: {
      position: 'absolute',
      height: 2, width: 28,
      backgroundColor: C.accent,
      left: -14,
    },
    crosshairDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: C.accent,
    },
    pinHeader: {
      position: 'absolute', top: 0, left: 0, right: 0,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenH,
      backgroundColor: 'rgba(10,10,10,0.80)',
      paddingBottom: 12,
    },
    pinHeaderTitle: {
      fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.text.primary,
    },
    pinFooter: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: C.background.card,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: Spacing.screenH,
      paddingTop: 16,
      gap: Spacing.gap,
    },
    pinHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pinHintText: { fontSize: Typography.sizes.chip, color: C.text.secondary, flex: 1 },
    pinActions: { flexDirection: 'row', gap: Spacing.gap, paddingBottom: 4 },
    pinCancel: {
      flex: 1, height: Components.buttonHeight,
      borderRadius: Radius.button, borderWidth: 1, borderColor: C.background.divider,
      alignItems: 'center', justifyContent: 'center',
    },
    pinCancelText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.medium, color: C.text.secondary },
    pinConfirm: {
      flex: 2, height: Components.buttonHeight,
      borderRadius: Radius.button, backgroundColor: C.accent,
      alignItems: 'center', justifyContent: 'center',
    },
    pinConfirmText: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.semibold, color: C.background.primary },

    // Search overlay
    overlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: C.background.primary,
    },
    overlayHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: Spacing.screenH,
      paddingBottom: 12,
      backgroundColor: C.background.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: C.background.divider,
    },
    overlayBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    overlayInputWrap: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.background.elevated,
      borderRadius: Radius.button, borderWidth: 1.5,
      paddingHorizontal: 12, height: Components.inputHeight,
      gap: 8,
    },
    overlayInput: {
      flex: 1, fontSize: Typography.sizes.body,
      height: '100%',
    },
    overlayLabel: {
      fontSize: Typography.sizes.eyebrow, fontWeight: '600',
      letterSpacing: 1.2,
      paddingHorizontal: Spacing.screenH,
      paddingTop: 20, paddingBottom: 10,
    },
    pinRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: Spacing.screenH, paddingVertical: 14,
      minHeight: Components.touchMin,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    pinRowIcon: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    pinRowText: { flex: 1, fontSize: Typography.sizes.body, fontWeight: Typography.weights.medium },
    dividerRow: { height: 1, marginVertical: 4 },
    loadingRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, paddingVertical: 32,
    },
    loadingText: { fontSize: Typography.sizes.body },
    suggestionList: { paddingBottom: 40 },
    suggestionRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.screenH, paddingVertical: 14,
      gap: 12, minHeight: Components.touchMin,
    },
    suggestionIcon: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    suggestionTexts: { flex: 1 },
    suggestionMain: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.medium },
    suggestionSub: { fontSize: Typography.sizes.chip, marginTop: 2 },
    emptyHint: { alignItems: 'center', paddingVertical: 48 },
    emptyHintText: { fontSize: Typography.sizes.body },

    // Frequent locations
    freqEyebrow: {
      fontSize: Typography.sizes.eyebrow, fontWeight: '600',
      letterSpacing: 1.2,
      paddingHorizontal: Spacing.screenH,
      paddingTop: 16, paddingBottom: 8,
    },
    freqRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.screenH, paddingVertical: 12,
      gap: 12, minHeight: Components.touchMin,
    },
    freqIcon: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    freqTexts: { flex: 1 },
    freqMain: { fontSize: Typography.sizes.body, fontWeight: Typography.weights.medium },
    freqSub: { fontSize: Typography.sizes.chip, marginTop: 2 },
    freqCount: { fontSize: Typography.sizes.chip },
  });
}
