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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReasonModal } from "@/components/ReasonModal";
import { Colors } from "@/constants/colors";
import { getOrders, cancelOrder, type Order } from "@/lib/api";
import { CustomAlert } from "@/store/alert-store";
import { LayoutAnimation } from "react-native";

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PendingPayment:    { label: "Awaiting Payment",    color: Colors.secondary, icon: "time-outline" },
  Confirmed:         { label: "Confirmed",            color: "#2e7d32",        icon: "checkmark-circle-outline" },
  Cooking:           { label: "Cooking in Clay Pot",  color: Colors.primary,   icon: "flame-outline" },
  OutForDelivery:    { label: "Handovered",           color: "#1565c0",        icon: "bicycle-outline" },
  Delivered:         { label: "Delivered",            color: "#2e7d32",        icon: "bag-check-outline" },
  Cancelled:         { label: "Cancelled",            color: Colors.error,     icon: "close-circle-outline" },
  PendingAdminAction:{ label: "Pending Admin Review", color: Colors.secondary, icon: "hourglass-outline" },
};

const TIMELINE_STAGES: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "orderedAt",         label: "Payment Submitted",   icon: "card-outline" },
  { key: "confirmedAt",       label: "Verified",            icon: "checkmark-circle-outline" },
  { key: "cookingStartedAt",  label: "Cooking in Clay Pot", icon: "flame-outline" },
  { key: "outForDeliveryAt",  label: "Handovered (Out for Delivery)",    icon: "bicycle-outline" },
  { key: "deliveredAt",       label: "Delivered",           icon: "bag-check-outline" },
];

const ACTIVE_STATUSES = [
  "PendingPayment",
  "Confirmed",
  "Cooking",
  "OutForDelivery",
  "PendingAdminAction",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const today = new Date(Date.now() + 6 * 3_600_000);
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

// ─── Timeline (active order) ──────────────────────────────────────────────────

function OrderTimeline({
  order,
}: {
  order: Order & Record<string, unknown>;
}) {
  const statusMap: Record<string, string | null | undefined> = {
    orderedAt: order.orderedAt,
    confirmedAt: order.confirmedAt,
    cookingStartedAt: order.cookingStartedAt as string | undefined,
    outForDeliveryAt: order.outForDeliveryAt as string | undefined,
    deliveredAt: order.deliveredAt,
  };

  return (
    <View
      style={{
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: Colors.primary,
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {TIMELINE_STAGES.map((stage, i) => {
        const isDone = Boolean(statusMap[stage.key]);
        const isCurrent =
          !isDone && (i === 0 || TIMELINE_STAGES.slice(0, i).every((s) => statusMap[s.key]));
        const ts = statusMap[stage.key];

        return (
          <View key={stage.key} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: i < TIMELINE_STAGES.length - 1 ? 20 : 0 }}>
            {/* Connector line */}
            {i < TIMELINE_STAGES.length - 1 && (
              <View
                style={{
                  position: "absolute",
                  left: 19,
                  top: 40,
                  width: 2,
                  height: 20,
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
                  ? Colors.surfaceContainerLowest
                  : Colors.surfaceContainerHighest,
                borderWidth: isCurrent ? 2.5 : 0,
                borderColor: isCurrent ? Colors.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: isDone ? Colors.primary : "transparent",
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: isDone ? 3 : 0,
              }}
            >
              <Ionicons
                name={isDone ? "checkmark" : stage.icon}
                size={isDone ? 18 : 16}
                color={isDone ? "#fff" : isCurrent ? Colors.primary : Colors.outline}
              />
            </View>
            {/* Label */}
            <View style={{ flex: 1, paddingTop: 2, paddingLeft: 14 }}>
              <Text
                style={{
                  fontWeight: isCurrent ? "700" : "600",
                  fontSize: isCurrent ? 15 : 13,
                  color: isCurrent ? Colors.primary : isDone ? Colors.onSurface : Colors.outline,
                }}
              >
                {stage.label}
              </Text>
              {ts ? (
                <Text style={{ fontSize: 11, color: Colors.outline, marginTop: 1 }}>
                  {new Date(ts).toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              ) : isCurrent ? (
                <Text style={{ fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 1 }}>
                  In progress…
                </Text>
              ) : (
                <Text style={{ fontSize: 11, color: Colors.outline, marginTop: 1, opacity: 0.5 }}>
                  Upcoming
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Active Order Card ────────────────────────────────────────────────────────

function ActiveOrderCard({
  order,
  onCancel,
  onRefresh,
}: {
  order: Order & Record<string, unknown>;
  onCancel: (id: string) => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[order.status];

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View
      style={{
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: `${Colors.outlineVariant}18`,
        overflow: "hidden",
        shadowColor: Colors.primary,
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.9}
        style={{ padding: 14 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", color: Colors.secondary, marginBottom: 3 }}>
              Live Status
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.onSurface, letterSpacing: -0.5 }}>
              {meta?.label ?? "Processing"}
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.primary }}>
            #{order.id.slice(-6).toUpperCase()}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Image
            source={{
              uri:
                order.menu.imageUrl ??
                "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200",
            }}
            style={{ width: 56, height: 56, borderRadius: 10 }}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.onSurface }}>
              {order.menu.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <View style={{ backgroundColor: `${Colors.secondary}12`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons
                  name={order.menu.type === "Lunch" ? "sunny-outline" : "moon-outline"}
                  size={11}
                  color={Colors.secondary}
                />
                <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.secondary, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {order.menu.type}
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.primary, marginLeft: "auto" }}>
                ৳{order.totalPrice}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Payment missing warning strip */}
      {order.status === "PendingPayment" && !order.trxId && (
        <TouchableOpacity
          onPress={() => router.push(`/order/${order.id}`)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginHorizontal: 14,
            marginBottom: 14,
            backgroundColor: `${Colors.secondary}14`,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderWidth: 1,
            borderColor: `${Colors.secondary}28`,
          }}
        >
          <Ionicons name="warning-outline" size={16} color={Colors.secondary} />
          <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: Colors.secondary, lineHeight: 17 }}>
            Payment not submitted — tap to add your TrxID
          </Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
        </TouchableOpacity>
      )}

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: `${Colors.outlineVariant}18` }}>
          <View style={{ padding: 16 }}>
            <OrderTimeline order={order} />
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: `${Colors.outlineVariant}10` }}>
            {order.status === "PendingPayment" && !order.trxId ? (
              <TouchableOpacity
                onPress={() => router.push(`/order/${order.id}`)}
                activeOpacity={0.75}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, backgroundColor: `${Colors.secondary}10` }}
              >
                <Ionicons name="card-outline" size={17} color={Colors.secondary} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.secondary }}>Submit Payment</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push(`/order/${order.id}`)}
                activeOpacity={0.75}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 }}
              >
                <Ionicons name="receipt-outline" size={17} color={Colors.primary} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.primary }}>View Details</Text>
              </TouchableOpacity>
            )}

            {!["Delivered", "Cancelled"].includes(order.status) && (
              <>
                <View style={{ width: 1, backgroundColor: `${Colors.outlineVariant}15` }} />
                <TouchableOpacity
                  onPress={() => onCancel(order.id)}
                  activeOpacity={0.75}
                  style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 }}
                >
                  <Ionicons name="close-circle-outline" size={17} color={Colors.error} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.error }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Past order group (collapsible) ──────────────────────────────────────────

function DateGroup({
  date,
  orders,
  onViewOrder,
}: {
  date: string;
  orders: Order[];
  onViewOrder: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={{ marginBottom: 10 }}>
      {/* Group header */}
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 10,
          paddingHorizontal: 4,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="calendar-outline" size={15} color={Colors.secondary} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.secondary, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {formatDate(date)}
          </Text>
          <View
            style={{
              backgroundColor: `${Colors.secondary}15`,
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.secondary }}>
              {orders.length}
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.outline}
        />
      </TouchableOpacity>

      {/* Separator */}
      <View style={{ height: 1, backgroundColor: `${Colors.outlineVariant}30`, marginHorizontal: 4, marginBottom: expanded ? 8 : 0 }} />

      {/* Order cards */}
      {expanded &&
        orders.map((order) => {
          const meta = STATUS_META[order.status] ?? { label: order.status, color: Colors.outline, icon: "cube-outline" as keyof typeof Ionicons.glyphMap };
          return (
            <TouchableOpacity
              key={order.id}
              onPress={() => onViewOrder(order.id)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Colors.surfaceContainerLowest,
                borderRadius: 14,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: `${Colors.outlineVariant}20`,
                gap: 12,
              }}
            >
              <Image
                source={{
                  uri:
                    order.menu.imageUrl ??
                    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200",
                }}
                style={{ width: 56, height: 56, borderRadius: 10 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.onSurface }} numberOfLines={1}>
                  {order.menu.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                  <Ionicons name={meta.icon} size={12} color={meta.color} />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: meta.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {meta.label}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.secondary, marginTop: 4 }}>
                  ৳{order.totalPrice}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.outline} />
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch {
      /* handle offline */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleCancelOrder = async () => {
    if (!cancellingId || !cancellationReason.trim()) return;
    setActionLoading(true);
    try {
      await cancelOrder(cancellingId, cancellationReason.trim());
      CustomAlert.alert("Success", "Order cancellation requested.");
      load();
    } catch (e: any) {
      CustomAlert.alert("Error", e.message || "Failed to cancel order.");
    } finally {
      setActionLoading(false);
      setCancellingId(null);
      setCancellationReason("");
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  // Group past orders by effective date (deliveryDate or orderedAt date)
  const grouped: Record<string, Order[]> = {};
  for (const o of pastOrders) {
    const key = o.deliveryDate ?? o.orderedAt.slice(0, 10);
    (grouped[key] ??= []).push(o);
  }
  const groupedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 14,
          paddingHorizontal: 20,
          backgroundColor: "rgba(251,249,245,0.95)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: Colors.primary,
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 4,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="leaf-outline" size={18} color={Colors.primary} />
          <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.primary, letterSpacing: -0.5 }}>
            Matir Hari
          </Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.secondary }}>Mymensingh</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* ── Active orders ─────────────────────────────────────── */}
            {activeOrders.map((activeOrder) => (
              <ActiveOrderCard
                key={activeOrder.id}
                order={activeOrder as Order & Record<string, unknown>}
                onCancel={(id) => setCancellingId(id)}
                onRefresh={load}
              />
            ))}

            {/* ── Past orders grouped by date ────────────────────────── */}
            {pastOrders.length > 0 && (
              <View style={{ marginTop: activeOrders.length > 0 ? 4 : 0 }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: Colors.onSurface, marginBottom: 12, letterSpacing: -0.5 }}>
                  Order History
                </Text>
                {groupedDates.map((date) => (
                  <DateGroup
                    key={date}
                    date={date}
                    orders={grouped[date]}
                    onViewOrder={(id) => router.push(`/order/${id}`)}
                  />
                ))}
              </View>
            )}

            {orders.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 64 }}>
                <Ionicons name="restaurant-outline" size={56} color={`${Colors.primary}40`} style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.onSurface, marginBottom: 6 }}>
                  No orders yet
                </Text>
                <Text style={{ fontSize: 14, color: Colors.onSurfaceVariant, textAlign: "center" }}>
                  Place your first order from today&apos;s menu!
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/(tabs)")}
                  style={{ marginTop: 20, flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Text style={{ color: Colors.primary, fontWeight: "600", fontSize: 14 }}>
                    View Today&apos;s Menu
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ReasonModal
        visible={!!cancellingId}
        loading={actionLoading}
        title="Cancel Order"
        subtitle="Please provide a reason for cancelling this order."
        confirmLabel="Confirm Cancel"
        confirmColor={Colors.error}
        onConfirm={handleCancelOrder}
        onDismiss={() => setCancellingId(null)}
      />
    </View>
  );
}
