/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  name: 'Loada',
  slug: 'loada',
  version: '1.0.0',
  scheme: 'loada',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.loada.app',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
    },
  },
  android: {
    package: 'com.loada.app',
    adaptiveIcon: {
      backgroundColor: '#0A0A0A',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
      },
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission: 'Loada needs camera access to capture proof of delivery photos.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Loada needs photo library access to upload documents.',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Loada needs location access to match you with nearby jobs.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};
