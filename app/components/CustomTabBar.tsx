import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const TAB_META: Record<string, { icon: FeatherIconName; label: string }> = {
  index: { icon: "home", label: "Home" },
  history: { icon: "clock", label: "History" },
  profile: { icon: "user", label: "Profile" },
};

function TabItem({ isFocused, onPress, meta }: { isFocused: boolean; onPress: () => void; meta: { icon: FeatherIconName; label: string } }) {
  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0, { duration: 250 }),
      transform: [{ scale: withSpring(isFocused ? 1 : 0.6, { damping: 14 }) }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(isFocused ? -10 : 0, { damping: 14 }) }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0, { duration: 200 }),
      transform: [
        { scale: withSpring(isFocused ? 1 : 0.8, { damping: 14 }) },
        { translateY: withSpring(isFocused ? 2 : 10, { damping: 14 }) },
      ],
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 60 }}
      activeOpacity={0.7}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center", top: -14 }, animatedPillStyle]}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 50, height: 50, borderRadius: 25, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 }}
        />
      </Animated.View>
      <Animated.View style={animatedIconStyle}>
        <Feather name={meta.icon} size={22} color={isFocused ? Colors.onPrimary : Colors.outlineVariant} />
      </Animated.View>
      
      <Animated.View style={[{ position: "absolute", bottom: 2 }, animatedTextStyle]}>
        <Text style={{ fontSize: 10, fontWeight: "600", color: Colors.primary, letterSpacing: 0.5 }}>
          {meta.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) => {
    const opts = descriptors[r.key]?.options as { href?: null | string } | undefined;
    return opts?.href !== null;
  });

  return (
    <View style={{ backgroundColor: Colors.surface, paddingBottom: Platform.OS === "ios" ? insets.bottom : 20, paddingTop: 12, paddingHorizontal: 20 }}>
      <View
        style={{
          flexDirection: "row",
          backgroundColor: Colors.surfaceContainerLowest,
          borderRadius: 36,
          height: 68,
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          shadowColor: Colors.onSurface,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.02)"
        }}
      >
        {visibleRoutes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] ?? { icon: "circle", label: route.name };

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return <TabItem key={route.key} isFocused={isFocused} onPress={onPress} meta={meta} />;
        })}
      </View>
    </View>
  );
}
