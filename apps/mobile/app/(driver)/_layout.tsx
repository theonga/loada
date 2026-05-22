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

export default function DriverLayout() {
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
              name={focused ? "map" : "map-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="loads/index"
        options={{
          tabBarLabel: "Loads",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "cube" : "cube-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings/index"
        options={{
          tabBarLabel: "Earnings",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
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
      {/* Hidden routes */}
      <Tabs.Screen name="loads/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="bid/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="match/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="active/en-route" options={{ href: null }} />
      <Tabs.Screen name="active/pickup" options={{ href: null }} />
      <Tabs.Screen name="active/in-transit" options={{ href: null }} />
      <Tabs.Screen name="active/complete" options={{ href: null }} />
      <Tabs.Screen name="documents/index" options={{ href: null }} />
      <Tabs.Screen name="subscription/index" options={{ href: null }} />
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
      fontFamily: "SourceSans3_700Bold",
      fontSize: Typography.sizes.label,
      letterSpacing: 0.1,
      marginTop: 2,
    },
  });
}
