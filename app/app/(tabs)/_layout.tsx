import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";

type TabBarIconProps = {
  icon: string;
  label: string;
  focused: boolean;
};

function TabBarItem({ icon, label, focused }: TabBarIconProps) {
  if (focused) {
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 12,
          alignItems: "center",
          marginBottom: 2,
        }}
      >
        <Text style={{ fontSize: 20 }}>{icon}</Text>
        <Text
          style={{
            color: Colors.onPrimary,
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginTop: 2,
          }}
        >
          {label}
        </Text>
      </LinearGradient>
    );
  }
  return (
    <View style={{ alignItems: "center", paddingVertical: 8, paddingHorizontal: 12 }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text
        style={{
          color: Colors.secondary,
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: `${Colors.outlineVariant}33`,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 72,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarItem icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarItem icon="📋" label="History" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarItem icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
      {/* Hide the old explore screen */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
