import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import { useAuthStore } from '@store/auth.store';
import { disconnectAll } from '@services/socket';
import { DevPanel } from '@components/dev/DevPanel';
import { usePushToken } from '@hooks/usePushToken';
import { AppAlertHost } from '@components/ui/AppAlert';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, role, hydrate, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [hydrated, setHydrated] = useState(false);

  usePushToken((type, jobId) => {
    if (type === 'new_load') router.push(`/(driver)/loads/${jobId}`);
    else if (type === 'bid_received') router.push(`/(shipper)/bids/${jobId}`);
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
    } else if (isAuthenticated && !inAuthGroup && user && !user.name.trim()) {
      router.replace('/(auth)/name');
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
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
    DMMono_400Regular,
    DMMono_500Medium,
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
