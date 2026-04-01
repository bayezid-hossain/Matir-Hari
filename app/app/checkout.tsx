import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useState, useCallback, useRef } from "react";
import React from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import {
  getMenusByDate,
  createOrder,
  submitPayment,
  getMe,
  type MenuEntry,
  type SavedLocation,
  type LocationData,
} from "@/lib/api";
import { CustomAlert } from "@/store/alert-store";
import { useKeyboard } from "@/hooks/use-keyboard";
import { PaymentForm } from "@/components/PaymentForm";

const BKASH_NUMBER = "017XX-XXXXXX"; // Replace in production

function getBdtTodayString(): string {
  return new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);
}

function parseLocationData(raw: unknown): LocationData {
  if (raw && typeof raw === "object" && "locations" in raw) {
    return raw as LocationData;
  }
  return { locations: [], activeId: null };
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { menuId, deliveryDate } = useLocalSearchParams<{
    menuId: string;
    deliveryDate?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);
  const [menu, setMenu] = useState<MenuEntry | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [step, setStep] = useState<"summary" | "payment" | "done">("summary");
  const [paymentMethod, setPaymentMethod] = useState<"bKash" | "Nagad">("bKash");
  const [trxId, setTrxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(
    null
  );

  const effectiveDate = deliveryDate ?? getBdtTodayString();
  const isToday = effectiveDate === getBdtTodayString();

  // Load menu for the selected date
  useFocusEffect(
    useCallback(() => {
      if (!menuId) return;
      getMenusByDate(effectiveDate).then((data) => {
        const found =
          data.lunch?.id === menuId
            ? data.lunch
            : data.dinner?.id === menuId
            ? data.dinner
            : null;
        setMenu(found);
      });
    }, [menuId, effectiveDate])
  );

  // Load active location from profile — re-runs on focus (e.g. returning from saved-locations)
  useFocusEffect(
    useCallback(() => {
      getMe()
        .then((profile) => {
          const ld = parseLocationData(profile.locationData);
          const active =
            ld.locations.find((l) => l.id === ld.activeId) ??
            ld.locations[0] ??
            null;
          setSelectedLocation(active);
        })
        .catch(() => {});
    }, [])
  );

  const { isKeyboardVisible, keyboardHeight } = useKeyboard();

  const handlePlaceOrder = async () => {
    if (!menuId) return;

    if (!selectedLocation) {
      CustomAlert.alert(
        "No Delivery Location",
        "Please add a delivery location before placing an order.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Location",
            onPress: () => router.push("/profile/saved-locations"),
          },
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder(
        menuId,
        {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: selectedLocation.address,
        },
        isToday ? undefined : effectiveDate
      );
      setOrderId(order.id);
      setStep("payment");
    } catch (e: unknown) {
      CustomAlert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to place order."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!menu) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          backgroundColor: "rgba(251,249,245,0.95)",
          shadowColor: Colors.primary,
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 4,
        }}
        className="px-5 pb-4 flex-row items-center justify-between"
      >
        <Text
          className="text-xl font-headline-extra text-primary"
          style={{ letterSpacing: -0.5 }}
        >
          Matir Hari
        </Text>
        <Text className="text-on-surface font-body-medium">
          {isToday ? "Mymensingh" : "Pre-Order"}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ 
          padding: 20, 
          paddingBottom: isKeyboardVisible ? keyboardHeight + 40 : 120 
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text
          className="text-4xl font-headline-extra text-on-surface leading-tight mb-1"
          style={{ letterSpacing: -1 }}
        >
          Complete Your <Text className="text-primary">Order</Text>
        </Text>
        <Text className="text-on-surface-variant text-sm mb-8">
          Finalise your authentic Mymensingh culinary experience.
        </Text>

        {/* ── STEP 1 & 2: Summary ─────────────────────────────────────────── */}
        {(step === "summary" || step === "payment") && (
          <View className="gap-4 mb-6">
            {/* Meal card */}
            <View className="bg-surface-container-low rounded-xl p-5">
              <Text
                className="text-[10px] font-label uppercase text-secondary mb-2"
                style={{ letterSpacing: 2 }}
              >
                Selected Meal
              </Text>
              <Text className="text-xl font-headline text-on-surface mb-1">
                {menu.name}
              </Text>
              <Text className="text-sm text-on-surface-variant leading-relaxed mb-4">
                {menu.description}
              </Text>
              <Image
                source={{
                  uri:
                    menu.imageUrl ??
                    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
                }}
                style={{ width: "100%", height: 120, borderRadius: 10 }}
                resizeMode="cover"
              />
            </View>

            {/* Pre-order date badge (future orders only) */}
            {!isToday && (
              <View
                className="rounded-xl p-4 flex-row gap-3 items-center"
                style={{
                  backgroundColor: `${Colors.secondary}12`,
                  borderWidth: 1,
                  borderColor: `${Colors.secondary}20`,
                }}
              >
                <Text className="text-secondary text-base">📅</Text>
                <View>
                  <Text
                    className="text-[10px] font-label uppercase text-secondary"
                    style={{ letterSpacing: 1.5 }}
                  >
                    Pre-Order
                  </Text>
                  <Text className="text-sm font-body-medium text-on-surface">
                    Scheduled for{" "}
                    {new Date(effectiveDate + "T00:00:00Z").toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        timeZone: "UTC",
                      }
                    )}
                  </Text>
                </View>
              </View>
            )}

            {/* Delivery location card */}
            <View className="bg-surface-container-low rounded-xl p-5">
              <Text
                className="text-[10px] font-label uppercase text-secondary mb-3"
                style={{ letterSpacing: 2 }}
              >
                Delivery Location
              </Text>
              {selectedLocation ? (
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-body-semibold text-on-surface mb-0.5">
                      {selectedLocation.label}
                    </Text>
                    <Text
                      className="text-sm text-on-surface-variant"
                      numberOfLines={2}
                    >
                      {selectedLocation.address}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/profile/saved-locations")}
                    style={{
                      paddingVertical: 5,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: `${Colors.primary}12`,
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.primary,
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => router.push("/profile/saved-locations")}
                >
                  <Text className="text-primary font-body-semibold text-sm">
                    + Add a delivery location
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Price breakdown */}
            <View className="bg-surface-container-high rounded-xl p-5 gap-3">
              <Text
                className="text-[10px] font-label uppercase text-secondary"
                style={{ letterSpacing: 2 }}
              >
                Financial Summary
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-on-surface-variant">Meal Subtotal</Text>
                <Text className="font-body-medium text-on-surface">
                  ৳ {menu.price}.00
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-primary font-body-semibold">
                  Commitment Fee
                </Text>
                <Text className="font-body-semibold text-primary">৳ 50.00</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-on-surface-variant">Delivery Fee</Text>
                <Text className="font-body-medium text-on-surface">৳ 30.00</Text>
              </View>
              <View
                className="flex-row justify-between items-end pt-3"
                style={{
                  borderTopWidth: 1,
                  borderTopColor: `${Colors.outlineVariant}28`,
                }}
              >
                <Text className="text-on-surface font-body-semibold">
                  Total Due Now
                </Text>
                <Text className="text-2xl font-headline-extra text-on-surface">
                  ৳ 50.00
                </Text>
              </View>
              <Text className="text-[10px] text-on-surface-variant leading-snug">
                *৳50 secures your slot. Remaining ৳{menu.price - 50 + 30}{" "}
                payable on delivery.
              </Text>
            </View>
          </View>
        )}

        {/* Grace period notice */}
        <View
          className="bg-error-container/20 rounded-xl p-4 mb-6 flex-row gap-3"
          style={{ borderWidth: 1, borderColor: `${Colors.error}18` }}
        >
          <Text className="text-error text-base">⏱</Text>
          <View className="flex-1">
            <Text className="text-sm font-body-semibold text-error mb-1">
              30-Minute Grace Period
            </Text>
            <Text className="text-xs text-on-surface-variant leading-relaxed">
              Cancellations within 30 minutes qualify for a full refund of the
              ৳50 commitment fee.
            </Text>
          </View>
        </View>

        {/* ── STEP 2: Payment ────────────────────────────────────────────── */}
        {step === "payment" && (
          <View className="gap-5 mb-6">
            {/* Payment Details */}
            <PaymentForm
              orderId={orderId!}
              paddingBottom={20}
              onSuccess={() => setStep("done")}
            />
          </View>
        )}

        {/* ── STEP 3: Done ───────────────────────────────────────────────── */}
        {step === "done" && (
          <View className="items-center py-10 gap-4">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-2">
              <Text className="text-4xl">✅</Text>
            </View>
            <Text className="text-2xl font-headline text-on-surface text-center">
              Order Placed!
            </Text>
            <Text className="text-on-surface-variant text-sm text-center leading-relaxed px-4">
              Your commitment fee submission has been sent. The admin will verify
              your TrxID and confirm the order.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/history")}
              className="mt-4"
            >
              <Text className="text-primary font-body-semibold text-base">
                Track Your Order →
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {step === "summary" && (
        <View
          style={{
            paddingBottom: isKeyboardVisible ? keyboardHeight : (insets.bottom + 16),
            paddingHorizontal: 20,
            paddingTop: 12,
            backgroundColor: Colors.surface,
            borderTopWidth: 1,
            borderTopColor: `${Colors.outlineVariant}28`,
          }}
        >
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 56,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text
                  style={{
                    color: Colors.onPrimary,
                    fontWeight: "800",
                    fontSize: 16,
                    letterSpacing: 0.5,
                  }}
                >
                  Place Order
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            className="items-center mt-4"
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Text className="text-on-surface-variant font-body-medium text-sm">
              ← Back to Menu
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
