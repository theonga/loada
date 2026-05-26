import React, { useEffect, useState } from 'react';
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
import { disconnectAll } from '@services/socket';
import { DevPanel } from '@components/dev/DevPanel';
import { usePushToken } from '@hooks/usePushToken';
import { AppAlertHost } from '@components/ui/AppAlert';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, role, hydrate } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [hydrated, setHydrated] = useState(false);

  usePushToken((type, jobId) => {
    if (type === 'bid_received') router.push(`/(shipper)/bids/${jobId}`);
    else if (type === 'matched') router.push(role === 'driver' ? `/(driver)/match/${jobId}` : `/(shipper)/match/${jobId}`);
    else if (type === 'chat_message') router.push(`/(shared)/chat/${jobId}`);
  });

  useEffect(() => {
    hydrate().then(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    // Allow authenticated users to complete onboarding screens before being redirected
    const inOnboarding = inAuthGroup && (segments[1] === 'driver-setup' || segments[1] === 'name');

    if (!isAuthenticated && !inAuthGroup) {
      disconnectAll();
      router.replace('/(auth)');
    } else if (isAuthenticated && inAuthGroup && !inOnboarding) {
      router.replace(role === 'driver' ? '/(driver)' : '/(shipper)');
    }
  }, [isAuthenticated, role, segments, navigationState?.key, hydrated]);

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
          <AppAlertHost />
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
