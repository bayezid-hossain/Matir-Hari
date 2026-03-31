import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getAuthUser } from "@/lib/auth";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  read: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, string> = {
  cutoff_reminder: "⏰",
  order_confirmed: "✅",
  payment_verified: "💳",
  out_for_delivery: "🛵",
  delivered: "🎉",
};

// Fetch via the API client
async function fetchNotifications(): Promise<Notification[]> {
  const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  const { default: SecureStore } = await import("expo-secure-store");
  const token = await SecureStore.getItemAsync("auth_token");
  const res = await fetch(`${BASE}/api/users/me/notifications`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function markAllRead() {
  const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
  const { default: SecureStore } = await import("expo-secure-store");
  const token = await SecureStore.getItemAsync("auth_token");
  await fetch(`${BASE}/api/users/me/notifications`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setItems(data);
      // Mark all as read on open
      if (data.some((n) => !n.read)) await markAllRead();
    } catch { /* offline */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          backgroundColor: Colors.surface,
          shadowColor: Colors.primary,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceContainerLow, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 18, color: Colors.onSurface }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.primary, letterSpacing: -0.5, flex: 1 }}>
          Notifications
        </Text>
        {unread > 0 && (
          <View style={{ backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color: Colors.onPrimary, fontSize: 11, fontWeight: "700" }}>{unread}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.onSurface, marginBottom: 8 }}>
              No notifications yet
            </Text>
            <Text style={{ fontSize: 14, color: Colors.onSurfaceVariant, textAlign: "center" }}>
              You'll get alerts 30 minutes before cut-off times and when your order status updates.
            </Text>
          </View>
        ) : (
          items.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              onPress={() => notif.orderId && router.push({ pathname: "/order/[id]", params: { id: notif.orderId } })}
              activeOpacity={notif.orderId ? 0.7 : 1}
              style={{
                backgroundColor: notif.read ? Colors.surfaceContainerLowest : `${Colors.primaryFixed}80`,
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                flexDirection: "row",
                gap: 14,
                alignItems: "flex-start",
                borderWidth: notif.read ? 0 : 1,
                borderColor: `${Colors.primary}20`,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: notif.read ? Colors.surfaceContainerHigh : Colors.primaryFixed,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>
                  {TYPE_ICONS[notif.type] ?? "📢"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.onSurface, flex: 1 }}>
                    {notif.title}
                  </Text>
                  {!notif.read && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4, marginLeft: 8 }} />
                  )}
                </View>
                <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 4, lineHeight: 20 }}>
                  {notif.message}
                </Text>
                <Text style={{ fontSize: 11, color: Colors.outline, marginTop: 6 }}>
                  {new Date(notif.createdAt).toLocaleString("en-BD", { dateStyle: "short", timeStyle: "short" })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
