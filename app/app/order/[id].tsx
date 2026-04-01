import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getOrderById, cancelOrder, requestChange, type Order } from "@/lib/api";
import { CustomAlert } from "@/store/alert-store";
import { Ionicons } from "@expo/vector-icons";
import { ReasonModal } from "@/components/ReasonModal";
import { PaymentForm } from "@/components/PaymentForm";
import { useKeyboard } from "@/hooks/use-keyboard";

// ─── Timeline ────────────────────────────────────────────────────────────────

type TimelineStage = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeLabel?: string;
};

const STAGES: TimelineStage[] = [
  { key: "orderedAt",        label: "Payment Submitted",    icon: "card-outline" },
  { key: "confirmedAt",      label: "Verified",             icon: "checkmark-circle-outline", activeLabel: "Awaiting verification…" },
  { key: "cookingStartedAt", label: "Cooking in Clay Pot",  icon: "flame-outline",            activeLabel: "Slow-cooking your meal…" },
  { key: "outForDeliveryAt", label: "Handovered",           icon: "bicycle-outline",          activeLabel: "On the way to you…" },
  { key: "deliveredAt",      label: "Delivered",            icon: "bag-check-outline" },
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
      style={{
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
        padding: 24,
        shadowColor: Colors.primary,
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 112,
          height: 112,
          borderRadius: 56,
          backgroundColor: `${Colors.primary}06`,
          marginRight: -14,
          marginTop: -14,
        }}
      />
      {STAGES.map((stage, i) => {
        const ts = order[stage.key] as string | null | undefined;
        const isDone = Boolean(ts);
        const isCurrent =
          !isDone &&
          (i === 0 || STAGES.slice(0, i).every((s) => Boolean(order[s.key])));
        const isUpcoming = !isDone && !isCurrent;

        return (
          <View key={stage.key} style={{ marginBottom: i < STAGES.length - 1 ? 28 : 0 }}>
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
                <Ionicons
                  name={isDone ? "checkmark" : stage.icon}
                  size={isDone ? 18 : 16}
                  color={isDone ? "#fff" : isCurrent ? Colors.primary : Colors.outline}
                />
              </View>

              <View style={{ flex: 1, paddingTop: 2 }}>
                <Text
                  style={{
                    fontSize: isCurrent ? 16 : 14,
                    fontWeight: isCurrent ? "700" : "600",
                    color: isCurrent ? Colors.primary : isDone ? Colors.onSurface : Colors.outline,
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

// ─── Reason Modal ─────────────────────────────────────────────────────────────


// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<(Order & Record<string, unknown>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalType, setModalType] = useState<"cancel" | "change" | null>(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getOrderById(id);
      setOrder(data as Order & Record<string, unknown>);
    } catch {
      CustomAlert.alert("Error", "Could not load order.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const canCancel =
    order && !["Delivered", "Cancelled", "PendingAdminAction"].includes(order.status);

  const handleCancelConfirm = async (reason: string) => {
    setModalType(null);
    setActionLoading(true);
    try {
      const updated = await cancelOrder(id!, reason);
      setOrder(updated as Order & Record<string, unknown>);
      CustomAlert.alert(
        "Done",
        order?.cutOffReached
          ? "Cancellation request sent to admin."
          : "Order cancelled successfully."
      );
    } catch (e: unknown) {
      CustomAlert.alert("Error", e instanceof Error ? e.message : "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeConfirm = async (reason: string) => {
    setModalType(null);
    setActionLoading(true);
    try {
      const updated = await requestChange(id!, reason);
      setOrder(updated as Order & Record<string, unknown>);
      CustomAlert.alert("Submitted", "Your change request has been sent to admin.");
    } catch (e: unknown) {
      CustomAlert.alert("Error", e instanceof Error ? e.message : "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const statusColor =
    order?.status === "Cooking"
      ? Colors.primary
      : order?.status === "OutForDelivery"
      ? "#2E7D32"
      : order?.status === "PendingPayment"
      ? Colors.secondary
      : order?.status === "PendingAdminAction"
      ? "#ea580c"
      : Colors.outline;

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
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/history")}
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
          contentContainerStyle={{ 
            padding: 20, 
            paddingBottom: isKeyboardVisible ? keyboardHeight + 60 : 140 
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order meal card */}
          <View
            style={{
              backgroundColor: Colors.surfaceContainerLowest,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
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
                    order?.menu?.imageUrl ??
                    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200",
                }}
                style={{ width: 64, height: 64, borderRadius: 10 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.onSurface }}>{order?.menu?.name}</Text>
                <Text style={{ fontSize: 12, color: Colors.outline, marginTop: 2 }}>
                  {new Date(order.orderedAt as string).toLocaleString("en-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 6, gap: 6 }}>
                  <View style={{ backgroundColor: `${Colors.secondary}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.secondary, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {order?.menu?.type}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: `${statusColor}15`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: statusColor, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {order.status as string}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.primary }}>
              ৳{order.totalPrice}
            </Text>
          </View>

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
                  : order.status as string}
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

          {/* Status-specific warning banners */}
          {order.status === "PendingPayment" && !order.trxId && (
            <View
              style={{
                backgroundColor: `${Colors.secondary}14`,
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: `${Colors.secondary}30`,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <Ionicons name="warning-outline" size={22} color={Colors.secondary} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.secondary, marginBottom: 4 }}>
                  Payment Not Submitted
                </Text>
                <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19 }}>
                  Your order is not confirmed yet. Please provide your bKash/Nagad Transaction ID below to complete the booking.
                </Text>
              </View>
            </View>
          )}

          {order.status === "PendingAdminAction" && (
            <View
              style={{
                backgroundColor: "#fff7ed",
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "#fdba74",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <Ionicons name="alert-circle" size={22} color="#ea580c" style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#9a3412", marginBottom: 4 }}>
                  Cancellation Requested
                </Text>
                <Text style={{ fontSize: 13, color: "#c2410c", lineHeight: 19 }}>
                  Your cancellation request has been sent to the admin. You will be notified once it is processed.
                </Text>
              </View>
            </View>
          )}

          {/* Live timeline */}
          <View style={{ marginBottom: 20 }}>
            <Timeline order={order} />
          </View>

          {/* Payment info */}
          {!!(order.trxId || order.paymentMethod) && !isEditingPayment && (
            <View
              style={{
                backgroundColor: Colors.surfaceContainerLow,
                borderRadius: 16,
                padding: 16,
                marginTop: 12,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", color: Colors.secondary }}>
                  Payment Info
                </Text>
                {order.status === "PendingPayment" && (
                  <TouchableOpacity
                    onPress={() => setIsEditingPayment(true)}
                    style={{ backgroundColor: `${Colors.primary}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: Colors.primary }}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant }}>Method</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.onSurface }}>{order.paymentMethod as string}</Text>
              </View>
              {!!order.trxId && (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant }}>TrxID</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.primary }}>{order.trxId as string}</Text>
                </View>
              )}
              {!!order.paymentScreenshot && (
                 <View style={{ marginTop: 4 }}>
                   <Text style={{ fontSize: 11, fontWeight: "700", color: Colors.outline, textTransform: "uppercase", marginBottom: 6 }}>Proof Attachment</Text>
                   <Image source={{ uri: order.paymentScreenshot }} style={{ width: "100%", height: 120, borderRadius: 10 }} resizeMode="cover" />
                 </View>
              )}
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

          {/* Inline payment form — shown when info is missing OR user is editing */}
          {order.status === "PendingPayment" && (!order.trxId && !order.paymentScreenshot || isEditingPayment) && (
            <View style={{ marginTop: 16 }}>
              <PaymentForm
                orderId={id!}
                initialTrxId={order.trxId || ""}
                initialPaymentMethod={(order.paymentMethod as any) || "bKash"}
                initialScreenshot={order.paymentScreenshot || undefined}
                onSuccess={() => {
                  setIsEditingPayment(false);
                  load();
                }}
              />
              {isEditingPayment && (
                <TouchableOpacity
                  onPress={() => setIsEditingPayment(false)}
                  style={{ marginTop: 12, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.outline }}>Cancel Editing</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Admin note */}
          {!!order.adminNote && (
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
              onPress={() => setModalType("change")}
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
            onPress={() => setModalType("cancel")}
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

      {/* Cancel modal */}
      <ReasonModal
        visible={modalType === "cancel"}
        title={order?.cutOffReached ? "Request Cancellation" : "Cancel Order"}
        subtitle={
          order?.cutOffReached
            ? "Cut-off has passed. Your cancellation will be reviewed by the admin. Please provide a reason:"
            : "Please provide a reason for cancellation:"
        }
        confirmLabel={order?.cutOffReached ? "Send Request" : "Cancel Order"}
        confirmColor={Colors.error}
        onConfirm={handleCancelConfirm}
        onDismiss={() => setModalType(null)}
      />

      {/* Request change modal */}
      <ReasonModal
        visible={modalType === "change"}
        loading={actionLoading}
        title="Request Change"
        subtitle="Describe the change you need. The admin will review your request."
        confirmLabel="Send Request"
        confirmColor={Colors.primary}
        onConfirm={handleChangeConfirm}
        onDismiss={() => setModalType(null)}
      />
    </View>
  );
}
