import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  SourceSans3_300Light,
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';
import { useAuthStore } from '@store/auth.store';
import { MOCK_SHIPPER } from '@services/mock/data';
import { DevPanel } from '@components/dev/DevPanel';

SplashScreen.preventAutoHideAsync();

function useDevModeAuth() {
  const { setUser, setRole, isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (__DEV__ && !isAuthenticated) {
      setUser(MOCK_SHIPPER);
      setRole('shipper');
    }
  }, []);
}

function RootLayoutNav() {
  const { isAuthenticated, role } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useDevModeAuth();

  useEffect(() => {
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup) {
      if (role === 'driver') {
        router.replace('/(driver)');
      } else {
        router.replace('/(shipper)');
      }
    }
  }, [isAuthenticated, role, segments, navigationState?.key]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(shipper)" />
      <Stack.Screen name="(driver)" />
      <Stack.Screen name="(shared)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SourceSans3_300Light,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.root}>
          <RootLayoutNav />
          <DevPanel />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
