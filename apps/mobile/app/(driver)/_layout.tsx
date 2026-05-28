import React, { useMemo, useState, useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useColors,
  ColorPalette,
  Components,
  Typography,
} from "@constants/theme";
import { getMyDriverProfile } from "@services";

export default function DriverLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => getStyles(C), [C]);
  const [vehicleOk, setVehicleOk] = useState(false);

  useEffect(() => {
    getMyDriverProfile()
      .then((p) => {
        if (p.truckMake === 'Unknown') {
          router.replace('/(auth)/driver-setup/vehicle');
        } else {
          setVehicleOk(true);
        }
      })
      .catch(() => setVehicleOk(true));
  }, []);

  if (!vehicleOk) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

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
      {/* Hidden routes */}
      <Tabs.Screen name="earnings/index" options={{ href: null }} />
      <Tabs.Screen name="loads/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="bid/[jobId]" options={{ href: null }} />
      <Tabs.Screen name="bid/pending/[bidId]" options={{ href: null }} />
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
      fontFamily: "DMSans_700Bold",
      fontSize: 13,
      letterSpacing: 0,
      marginTop: 2,
    },
  });
}
