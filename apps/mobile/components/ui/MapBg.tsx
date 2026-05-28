import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Polyline, Marker } from 'react-native-maps';

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  /** Rendered as the Marker's custom view */
  pin: React.ReactNode;
}

interface MapBgProps {
  children?: React.ReactNode;
  /** Elements rendered INSIDE MapView — use for geo-positioned Markers */
  mapChildren?: React.ReactNode;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  routePoints?: Array<{ latitude: number; longitude: number }>;
  mapRef?: React.RefObject<MapView | null>;
}

export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#141414' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1e1e1e' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#4a4a4a' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
];

const DEFAULT_REGION = {
  latitude: -17.8252,
  longitude: 31.0335,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export function MapBg({ children, mapChildren, initialRegion, routePoints, mapRef }: MapBgProps) {
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion ?? DEFAULT_REGION}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        moveOnMarkerPress={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        {routePoints && routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor="#F5A623"
            strokeWidth={3}
            lineDashPattern={[0]}
          />
        )}
        {mapChildren}
      </MapView>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
