import React, { useMemo } from "react";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useColors,
  ColorPalette,
  Components,
  Typography,
} from "@constants/theme";

export default function ShipperLayout() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: Components.tabbarHeight + insets.bottom,
            paddingBottom: insets.bottom,
          },
        ],
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.text.secondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs/index"
        options={{
          tabBarLabel: "Jobs",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          tabBarLabel: "Notifications",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Hidden routes — not in tab bar */}
      <Tabs.Screen name="post/route" options={{ href: null }} />
      <Tabs.Screen name="post/cargo" options={{ href: null }} />
      <Tabs.Screen name="post/pricing" options={{ href: null }} />
      <Tabs.Screen name="post/confirm" options={{ href: null }} />
      <Tabs.Screen name="bids/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="match/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="tracking/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="delivery/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="rate/[jobId]" options={{ href: null }} />
    </Tabs>
  );
}

function getStyles(C: ColorPalette) {
  return StyleSheet.create({
    tabBar: {
      backgroundColor: C.background.card,
      borderTopColor: C.background.divider,
      borderTopWidth: 1,
    },
    tabItem: {
      paddingTop: 6,
    },
    tabLabel: {
      fontFamily: "DMSans_700Bold",
      fontSize: 13,
      letterSpacing: 0,
      marginTop: 2,
    },
  });
}
