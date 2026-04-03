import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { registerPushToken } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
 
// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
 
export function usePushNotifications() {
  // Using explicit types and initial values to satisfy potentially strict environments
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  
  const { user, token: authTokens } = useAuthStore();
  const router = useRouter();
 
  useEffect(() => {
    // Only register if logged in
    if (!user || !authTokens) return;
 
    let isMounted = true;
 
    const register = async () => {
      const token = await registerForPushNotificationsAsync();
      if (!isMounted) return;
      if (token) {
        setExpoPushToken(token);
        try {
          await registerPushToken(token);
        } catch (err) {
          console.error("[Push] Failed to save token to backend:", err);
        }
      }
    };
 
    register();
 
    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      if (isMounted) setNotification(notif);
    });
 
    // This listener is fired whenever a user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.orderId) {
        router.push(`/order/${data.orderId}` as any);
      }
    });
 
    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, authTokens, router]);
 
  return { expoPushToken, notification };
}
 
async function registerForPushNotificationsAsync() {
  let token: string | undefined;
 
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#902d13",
    });
  }
 
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return undefined;
    }
 
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? 
      Constants?.easConfig?.projectId ??
      "3098fe51-8465-4390-94fd-f5d2e8e515e6"; 
 
    try {
      const expoToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = expoToken.data;
    } catch (e) {
      console.error("[Push] Error getting token:", e);
    }
  }
 
  return token;
}
