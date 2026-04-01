import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  BeVietnamPro_300Light,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
} from "@expo-google-fonts/be-vietnam-pro";
import { useAuthStore } from "@/store/auth-store";
import { GlobalAlert } from "@/components/ui/global-alert";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    BeVietnamPro_300Light,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
  });

  const { loadFromStorage, isLoaded: authLoaded } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (fontsLoaded && authLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoaded]);

  if (!fontsLoaded || !authLoaded) return null;

  return (
    <>
      <StatusBar style="dark" backgroundColor="#fbf9f5" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="checkout"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="profile/saved-locations" />
        <Stack.Screen name="profile/personal-info" />
        <Stack.Screen name="profile/notifications" />
        <Stack.Screen
          name="profile/location-picker"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
      </Stack>
      <GlobalAlert />
    </>
  );
}
