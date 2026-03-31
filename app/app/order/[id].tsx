import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getOrderById, cancelOrder, requestChange, type Order } from "@/lib/api";

// ─── Timeline ────────────────────────────────────────────────────────────────

type TimelineStage = {
  key: string;
  label: string;
  icon: string;
  activeLabel?: string;
};

const STAGES: TimelineStage[] = [
  { key: "orderedAt",        label: "Payment Submitted",    icon: "💳" },
  { key: "confirmedAt",      label: "Verified",             icon: "✅", activeLabel: "Awaiting verification…" },
  { key: "cookingStartedAt", label: "Cooking in Clay Pot",  icon: "🍲", activeLabel: "Slow-cooking your meal…" },
  { key: "outForDeliveryAt", label: "Out for Delivery",     icon: "🛵", activeLabel: "On the way to you…" },
  { key: "deliveredAt",      label: "Delivered",            icon: "🎉" },
];

const STATUS_COLORS: Record<string, string> = {
  PendingPayment: Colors.secondary,
  Confirmed: "#2e7d32",
  Cooking: Colors.primary,
  OutForDelivery: "#1565c0",
  Delivered: "#2e7d32",
  Cancelled: Colors.error,
  PendingAdminAction: Colors.secondary,
};

function Timeline({ order }: { order: Order & Record<string, unknown> }) {
  return (
    <View
      className="bg-surface-container-low rounded-2xl p-6"
      style={{ shadowColor: Colors.primary, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 }}
    >
      {/* Decorative blob */}
      <View
        className="absolute top-0 right-0 w-28 h-28 rounded-full"
        style={{ backgroundColor: `${Colors.primary}06`, marginRight: -14, marginTop: -14 }}
      />
      {STAGES.map((stage, i) => {
        const ts = order[stage.key] as string | null | undefined;
        const isDone = Boolean(ts);
        // A stage is "current" when previous stages are done but this one isn't
        const isCurrent =
          !isDone &&
          (i === 0 ||
            STAGES.slice(0, i).every((s) => Boolean(order[s.key])));
        const isUpcoming = !isDone && !isCurrent;

        return (
          <View key={stage.key} style={{ marginBottom: i < STAGES.length - 1 ? 28 : 0 }}>
            {/* Connector line */}
            {i < STAGES.length - 1 && (
              <View
                style={{
                  position: "absolute",
                  left: 19,
                  top: 40,
                  width: 2,
                  height: 28,
                  backgroundColor: isDone ? Colors.primary : `${Colors.outlineVariant}50`,
                  borderRadius: 1,
                }}
              />
            )}
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
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
                <Text style={{ fontSize: isDone ? 14 : 16, color: isDone ? "#fff" : undefined }}>
                  {isDone ? "✓" : stage.icon}
                </Text>
              </View>

              {/* Label */}
              <View style={{ flex: 1, paddingTop: 2 }}>
                <Text
                  style={{
                    fontSize: isCurrent ? 16 : 14,
                    fontWeight: isCurrent ? "700" : "600",
                    color: isCurrent
                      ? Colors.primary
                      : isDone
                      ? Colors.onSurface
                      : Colors.outline,
                  }}
                >
                  {stage.label}
                </Text>
                {ts ? (
                  <Text style={{ fontSize: 12, color: Colors.outline, marginTop: 2 }}>
                    {new Date(ts).toLocaleString("en-BD", {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                ) : isCurrent ? (
                  <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 }}>
                    {stage.activeLabel ?? "In progress…"}
                  </Text>
                ) : isUpcoming ? (
                  <Text style={{ fontSize: 12, color: Colors.outline, marginTop: 2, opacity: 0.6 }}>
                    Upcoming
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<(Order & Record<string, unknown>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getOrderById(id);
      setOrder(data as Order & Record<string, unknown>);
    } catch {
      Alert.alert("Error", "Could not load order.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    // Poll every 15 s for live updates while screen is open
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const isActive =
    order &&
    ["PendingPayment", "Confirmed", "Cooking", "OutForDelivery", "PendingAdminAction"].includes(
      order.status
    );

  const canCancel =
    order &&
    !["Delivered", "Cancelled"].includes(order.status);

  const handleCancel = () => {
    Alert.prompt(
      "Cancel Order",
      order?.cutOffReached
        ? "Cut-off has passed. Your cancellation will be sent to the admin for review. Please provide a reason:"
        : "Please provide a reason for cancellation:",
      async (reason) => {
        if (!reason?.trim()) return;
        setActionLoading(true);
        try {
          const updated = await cancelOrder(id!, reason);
          setOrder(updated as Order & Record<string, unknown>);
          Alert.alert(
            "Done",
            order?.cutOffReached
              ? "Cancellation request sent to admin."
              : "Order cancelled successfully."
          );
        } catch (e: unknown) {
          Alert.alert("Error", e instanceof Error ? e.message : "Failed.");
        } finally {
          setActionLoading(false);
        }
      },
      "plain-text"
    );
  };

  const handleRequestChange = () => {
    Alert.prompt(
      "Request Change",
      "Describe the change you need. Admin will review:",
      async (reason) => {
        if (!reason?.trim()) return;
        setActionLoading(true);
        try {
          const updated = await requestChange(id!, reason);
          setOrder(updated as Order & Record<string, unknown>);
          Alert.alert("Submitted", "Your change request has been sent to admin.");
        } catch (e: unknown) {
          Alert.alert("Error", e instanceof Error ? e.message : "Failed.");
        } finally {
          setActionLoading(false);
        }
      },
      "plain-text"
    );
  };

  const statusColor = order ? (STATUS_COLORS[order.status] ?? Colors.outline) : Colors.outline;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.surface, Colors.surface]}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: Colors.primary,
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.surfaceContainerLow,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, color: Colors.onSurface }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.primary, letterSpacing: -0.5 }}>
          Order Details
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : !order ? null : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Status banner */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 20,
            }}
          >
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", color: Colors.secondary, marginBottom: 4 }}>
                Live Status
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: Colors.onSurface, letterSpacing: -0.5, lineHeight: 28 }}>
                {order.status === "Cooking"
                  ? "Cooking in Clay Pot"
                  : order.status === "OutForDelivery"
                  ? "Out for Delivery"
                  : order.status === "PendingPayment"
                  ? "Awaiting Payment"
                  : order.status === "PendingAdminAction"
                  ? "Pending Admin Review"
                  : order.status}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: Colors.outline, marginBottom: 4 }}>
                Order ID
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.primary }}>
                #{(order.id as string).slice(-6).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Live timeline */}
          <Timeline order={order} />

          {/* Order meal card */}
          <View
            style={{
              backgroundColor: Colors.surfaceContainerLowest,
              borderRadius: 16,
              padding: 16,
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: `${Colors.outlineVariant}18`,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
              <Image
                source={{
                  uri:
                    order.menu.imageUrl ??
                    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200",
                }}
                style={{ width: 64, height: 64, borderRadius: 10 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.onSurface }}>{order.menu.name}</Text>
                <Text style={{ fontSize: 12, color: Colors.outline, marginTop: 2 }}>
                  {new Date(order.orderedAt as string).toLocaleString("en-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 6, gap: 6 }}>
                  <View style={{ backgroundColor: `${Colors.secondary}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.secondary, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {order.menu.type}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: `${statusColor}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: statusColor, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.primary }}>
              ৳{order.totalPrice}
            </Text>
          </View>

          {/* Payment info */}
          {order.trxId && (
            <View
              style={{
                backgroundColor: Colors.surfaceContainerLow,
                borderRadius: 16,
                padding: 16,
                marginTop: 12,
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", color: Colors.secondary }}>
                Payment Info
              </Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant }}>Method</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.onSurface }}>{order.paymentMethod as string}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant }}>TrxID</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.primary }}>{order.trxId as string}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant }}>Commitment Fee</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.onSurface }}>৳{order.commitmentFee}</Text>
              </View>
              <View
                style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, borderTopColor: `${Colors.outlineVariant}28` }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.onSurface }}>Balance on Delivery</Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: Colors.onSurface }}>
                  ৳{(order.totalPrice as number) + (order.deliveryFee as number) - (order.commitmentFee as number)}
                </Text>
              </View>
            </View>
          )}

          {/* Admin note */}
          {order.adminNote && (
            <View
              style={{ backgroundColor: `${Colors.secondary}10`, borderRadius: 12, padding: 14, marginTop: 12, flexDirection: "row", gap: 10 }}
            >
              <Text style={{ fontSize: 16 }}>📝</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.secondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  Admin Note
                </Text>
                <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20 }}>{order.adminNote as string}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom actions */}
      {order && canCancel && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: insets.bottom + 16,
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: `${Colors.outlineVariant}28`,
            gap: 10,
          }}
        >
          {order.cutOffReached ? (
            <TouchableOpacity
              onPress={handleRequestChange}
              disabled={actionLoading}
              style={{
                height: 52,
                borderRadius: 12,
                backgroundColor: Colors.surfaceContainerHigh,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {actionLoading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={{ color: Colors.primary, fontWeight: "700", fontSize: 15 }}>
                  Request Change (Post Cut-off)
                </Text>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleCancel}
            disabled={actionLoading}
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: `${Colors.errorContainer}60`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {actionLoading ? (
              <ActivityIndicator color={Colors.error} />
            ) : (
              <Text style={{ color: Colors.error, fontWeight: "700", fontSize: 15 }}>
                {order.cutOffReached ? "Request Cancellation" : "Cancel Order"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
