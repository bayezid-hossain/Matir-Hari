import { View, Text, TouchableOpacity, Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";

const TAB_META: Record<string, { icon: string; label: string }> = {
  index: { icon: "🏠", label: "Home" },
  history: { icon: "📋", label: "History" },
  profile: { icon: "👤", label: "Profile" },
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((r) => {
    const opts = descriptors[r.key]?.options as { href?: null | string } | undefined;
    return opts?.href !== null;
  });

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: `${Colors.outlineVariant}33`,
        paddingBottom: insets.bottom + 6,
        paddingTop: 8,
        paddingHorizontal: 16,
        // subtle shadow upward
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.indexOf(route);
        const meta = TAB_META[route.name] ?? { icon: "●", label: route.name };

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            style={{ flex: 1, alignItems: "center" }}
            activeOpacity={0.75}
          >
            {isFocused ? (
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 7,
                  borderRadius: 14,
                  alignItems: "center",
                  // slight lift
                  marginTop: -4,
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text style={{ fontSize: 18, lineHeight: 22 }}>{meta.icon}</Text>
                <Text
                  style={{
                    color: Colors.onPrimary,
                    fontSize: 9,
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginTop: 3,
                    lineHeight: 11,
                  }}
                >
                  {meta.label}
                </Text>
              </LinearGradient>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 7, paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 18, lineHeight: 22, opacity: 0.7 }}>{meta.icon}</Text>
                <Text
                  style={{
                    color: Colors.secondary,
                    fontSize: 9,
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginTop: 3,
                    lineHeight: 11,
                  }}
                >
                  {meta.label}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
