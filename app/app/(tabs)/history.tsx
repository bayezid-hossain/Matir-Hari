import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getOrders, type Order } from "@/lib/api";

const STATUS_META: Record<string, { label: string; color: string; emoji: string }> = {
  PendingPayment: { label: "Awaiting Payment", color: Colors.secondary, emoji: "⏳" },
  Confirmed: { label: "Confirmed", color: "#2e7d32", emoji: "✅" },
  Cooking: { label: "Cooking in Clay Pot", color: Colors.primary, emoji: "🍲" },
  OutForDelivery: { label: "Out for Delivery", color: "#1565c0", emoji: "🛵" },
  Delivered: { label: "Delivered", color: "#2e7d32", emoji: "🎉" },
  Cancelled: { label: "Cancelled", color: Colors.error, emoji: "❌" },
  PendingAdminAction: { label: "Pending Admin Review", color: Colors.secondary, emoji: "🔍" },
};

const TIMELINE_STAGES = [
  { key: "orderedAt", label: "Payment Submitted", icon: "💳" },
  { key: "confirmedAt", label: "Verified", icon: "✅" },
  { key: "cookingStartedAt", label: "Cooking in Clay Pot", icon: "🍲" },
  { key: "outForDeliveryAt", label: "Out for Delivery", icon: "🛵" },
  { key: "deliveredAt", label: "Delivered", icon: "🎉" },
] as const;

function OrderTimeline({ order }: { order: Order & { paymentSubmittedAt?: string; cookingStartedAt?: string; outForDeliveryAt?: string } }) {
  const statusMap: Record<string, string | null | undefined> = {
    orderedAt: order.orderedAt,
    confirmedAt: order.confirmedAt,
    cookingStartedAt: (order as Record<string, unknown>).cookingStartedAt as string | undefined,
    outForDeliveryAt: (order as Record<string, unknown>).outForDeliveryAt as string | undefined,
    deliveredAt: order.deliveredAt,
  };

  const doneCount = TIMELINE_STAGES.filter((s) => statusMap[s.key]).length;

  return (
    <View
      className="bg-surface-container-low rounded-xl p-6 mb-4"
      style={{ shadowColor: Colors.primary, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
    >
      {/* Decorative bg gradient */}
      <View
        className="absolute top-0 right-0 w-24 h-24 rounded-full"
        style={{ backgroundColor: `${Colors.primary}08`, marginRight: -24, marginTop: -24 }}
      />
      <View className="relative">
        {TIMELINE_STAGES.map((stage, i) => {
          const isDone = Boolean(statusMap[stage.key]);
          const isCurrent =
            !isDone &&
            (i === 0 || TIMELINE_STAGES.slice(0, i).every((s) => statusMap[s.key]));
          const ts = statusMap[stage.key];

          return (
            <View key={stage.key} className="flex-row items-start gap-4" style={{ marginBottom: i < TIMELINE_STAGES.length - 1 ? 24 : 0 }}>
              {/* Connector line */}
              {i < TIMELINE_STAGES.length - 1 && (
                <View
                  style={{
                    position: "absolute",
                    left: 19,
                    top: 40,
                    width: 2,
                    height: 24,
                    backgroundColor: isDone ? Colors.primary : `${Colors.outlineVariant}60`,
                    borderRadius: 1,
                  }}
                />
              )}
              {/* Dot */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDone
                    ? Colors.primary
                    : isCurrent
                      ? Colors.surface
                      : Colors.surfaceVariant,
                  borderWidth: isCurrent ? 3 : 0,
                  borderColor: isCurrent ? Colors.primary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: isDone ? Colors.primary : "transparent",
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: isDone ? 4 : 0,
                }}
              >
                <Text style={{ fontSize: isDone ? 16 : 14 }}>
                  {isDone ? "✓" : stage.icon}
                </Text>
              </View>
              {/* Label */}
              <View className="flex-1 pt-1">
                <Text
                  style={{
                    fontWeight: isCurrent ? "700" : "600",
                    fontSize: isCurrent ? 16 : 14,
                    color: isCurrent ? Colors.primary : isDone ? Colors.onSurface : Colors.outline,
                  }}
                >
                  {stage.label}
                </Text>
                {ts ? (
                  <Text className="text-xs text-outline mt-0.5">
                    {new Date(ts).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                ) : isCurrent ? (
                  <Text className="text-sm text-on-surface-variant">In progress…</Text>
                ) : (
                  <Text className="text-xs text-outline opacity-50">Upcoming</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function HistoryCard({ order, onReorder }: { order: Order; onReorder: (o: Order) => void }) {
  const meta = STATUS_META[order.status] ?? { label: order.status, color: Colors.outline, emoji: "📦" };
  return (
    <View
      className="bg-surface-container-low rounded-xl p-4 mb-3 flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Image
          source={{ uri: order.menu.imageUrl ?? "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200" }}
          style={{ width: 64, height: 64, borderRadius: 10 }}
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text className="text-on-surface font-body-semibold text-base">{order.menu.name}</Text>
          <Text className="text-outline text-xs mt-0.5">
            {new Date(order.orderedAt).toLocaleDateString("en-BD")}
          </Text>
          <View className="flex-row items-center gap-1 mt-1">
            <Text style={{ fontSize: 12 }}>{meta.emoji}</Text>
            <Text style={{ fontSize: 11, color: meta.color, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {meta.label}
            </Text>
          </View>
          <Text className="text-secondary font-body-semibold text-sm mt-1">৳{order.totalPrice}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onReorder(order)}
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", shadowColor: Colors.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 }}
      >
        <Text>🔄</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch { /* handle offline */ }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeOrder = orders.find((o) =>
    ["PendingPayment", "Confirmed", "Cooking", "OutForDelivery"].includes(o.status)
  );
  const pastOrders = orders.filter((o) => !["PendingPayment", "Confirmed", "Cooking", "OutForDelivery"].includes(o.status));

  const handleReorder = (order: Order) => {
    router.push({ pathname: "/checkout", params: { menuId: order.menu.id } });
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8, backgroundColor: "rgba(251,249,245,0.95)", shadowColor: Colors.primary, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 }}
        className="px-5 pb-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-1">
          <Text>📍</Text>
          <Text className="text-xl font-headline-extra text-primary" style={{ letterSpacing: -0.5 }}>Matir Hari</Text>
        </View>
        <Text className="text-secondary font-body-semibold text-sm">Mymensingh</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Live tracking section */}
            {activeOrder && (
              <View className="mb-8">
                <View className="flex-row justify-between items-end mb-5">
                  <View>
                    <Text className="text-[10px] font-label uppercase text-secondary mb-1" style={{ letterSpacing: 2 }}>Live Status</Text>
                    <Text className="text-2xl font-headline-extra text-on-surface leading-tight" style={{ letterSpacing: -0.5 }}>
                      {STATUS_META[activeOrder.status]?.label ?? "Processing"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-label uppercase text-outline mb-1" style={{ letterSpacing: 1 }}>Order</Text>
                    <Text className="text-sm font-headline text-primary">#{activeOrder.id.slice(-6).toUpperCase()}</Text>
                  </View>
                </View>
                <OrderTimeline order={activeOrder} />

                {/* Active order meal snippet */}
                <View
                  className="bg-surface-container-lowest p-5 rounded-xl flex-row justify-between items-center"
                  style={{ borderWidth: 1, borderColor: `${Colors.outlineVariant}18` }}
                >
                  <View className="flex-row items-center gap-3">
                    <Image
                      source={{ uri: activeOrder.menu.imageUrl ?? "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200" }}
                      style={{ width: 56, height: 56, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                    <View>
                      <Text className="text-on-surface font-headline font-bold text-base">{activeOrder.menu.name}</Text>
                      <Text className="text-outline text-xs mt-0.5">Order #{activeOrder.id.slice(-6).toUpperCase()}</Text>
                      <View className="mt-1">
                        <Text className="text-[10px] font-label uppercase bg-secondary/10 text-secondary px-2 py-0.5 rounded self-start" style={{ letterSpacing: 1 }}>
                          {activeOrder.menu.type}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text className="text-primary font-headline-extra text-lg">৳{activeOrder.totalPrice}</Text>
                </View>
              </View>
            )}

            {/* Past orders */}
            {pastOrders.length > 0 && (
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-headline-extra text-on-surface">Recent Feasts</Text>
                  <TouchableOpacity>
                    <Text className="text-sm font-body-semibold text-primary">View All</Text>
                  </TouchableOpacity>
                </View>
                {pastOrders.slice(0, 5).map((o) => (
                  <HistoryCard key={o.id} order={o} onReorder={handleReorder} />
                ))}
              </View>
            )}

            {orders.length === 0 && (
              <View className="items-center py-16">
                <Text className="text-5xl mb-4">🍲</Text>
                <Text className="text-on-surface font-body-semibold text-base mb-2">No orders yet</Text>
                <Text className="text-on-surface-variant text-sm text-center">Place your first order from today&apos;s menu!</Text>
                <TouchableOpacity onPress={() => router.replace("/(tabs)")} className="mt-5">
                  <Text className="text-primary font-body-semibold">View Today&apos;s Menu →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
