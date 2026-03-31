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
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getTodayMenus, createOrder, submitPayment, type MenuEntry } from "@/lib/api";

const BKASH_NUMBER = "017XX-XXXXXX"; // Replace in production

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { menuId } = useLocalSearchParams<{ menuId: string }>();

  const [menu, setMenu] = useState<MenuEntry | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [step, setStep] = useState<"summary" | "payment" | "done">("summary");
  const [paymentMethod, setPaymentMethod] = useState<"bKash" | "Nagad">("bKash");
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [address] = useState({ lat: 24.75, lng: 90.41, address: "Mymensingh City" });

  useEffect(() => {
    if (!menuId) return;
    getTodayMenus().then((data) => {
      const found =
        data.lunch?.id === menuId ? data.lunch : data.dinner?.id === menuId ? data.dinner : null;
      setMenu(found);
    });
  }, [menuId]);

  const handlePlaceOrder = async () => {
    if (!menuId) return;
    setLoading(true);
    try {
      const order = await createOrder(menuId, address);
      setOrderId(order.id);
      setStep("payment");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!orderId) return;
    if (!trxId.trim()) return Alert.alert("Missing TrxID", "Please enter your Transaction ID.");
    setLoading(true);
    try {
      await submitPayment(orderId, trxId.trim(), paymentMethod);
      setStep("done");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to submit payment.");
    } finally {
      setLoading(false);
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
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8, backgroundColor: "rgba(251,249,245,0.95)", shadowColor: Colors.primary, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 }}
        className="px-5 pb-4 flex-row items-center justify-between"
      >
        <Text className="text-xl font-headline-extra text-primary" style={{ letterSpacing: -0.5 }}>Matir Hari</Text>
        <Text className="text-on-surface font-body-medium">Mymensingh</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text className="text-4xl font-headline-extra text-on-surface leading-tight mb-1" style={{ letterSpacing: -1 }}>
          Complete Your <Text className="text-primary">Order</Text>
        </Text>
        <Text className="text-on-surface-variant text-sm mb-8">
          Finalise your authentic Mymensingh culinary experience.
        </Text>

        {/* ── STEP 1: Summary ─────────────────────────────────────────────────── */}
        {(step === "summary" || step === "payment") && (
          <View className="gap-4 mb-6">
            {/* Meal card */}
            <View className="bg-surface-container-low rounded-xl p-5">
              <Text className="text-[10px] font-label uppercase text-secondary mb-2" style={{ letterSpacing: 2 }}>
                Selected Meal
              </Text>
              <Text className="text-xl font-headline text-on-surface mb-1">{menu.name}</Text>
              <Text className="text-sm text-on-surface-variant leading-relaxed mb-4">{menu.description}</Text>
              <Image
                source={{ uri: menu.imageUrl ?? "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400" }}
                style={{ width: "100%", height: 120, borderRadius: 10 }}
                resizeMode="cover"
              />
            </View>

            {/* Price breakdown */}
            <View className="bg-surface-container-high rounded-xl p-5 gap-3">
              <Text className="text-[10px] font-label uppercase text-secondary" style={{ letterSpacing: 2 }}>
                Financial Summary
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-on-surface-variant">Meal Subtotal</Text>
                <Text className="font-body-medium text-on-surface">৳ {menu.price}.00</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-primary font-body-semibold">Commitment Fee</Text>
                <Text className="font-body-semibold text-primary">৳ 50.00</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-on-surface-variant">Delivery Fee</Text>
                <Text className="font-body-medium text-on-surface">৳ 30.00</Text>
              </View>
              <View
                className="flex-row justify-between items-end pt-3"
                style={{ borderTopWidth: 1, borderTopColor: `${Colors.outlineVariant}28` }}
              >
                <Text className="text-on-surface font-body-semibold">Total Due Now</Text>
                <Text className="text-2xl font-headline-extra text-on-surface">৳ 50.00</Text>
              </View>
              <Text className="text-[10px] text-on-surface-variant leading-snug">
                *৳50 secures your slot. Remaining ৳{menu.price - 50 + 30} payable on delivery.
              </Text>
            </View>
          </View>
        )}

        {/* Grace period notice */}
        <View className="bg-error-container/20 rounded-xl p-4 mb-6 flex-row gap-3" style={{ borderWidth: 1, borderColor: `${Colors.error}18` }}>
          <Text className="text-error text-base">⏱</Text>
          <View className="flex-1">
            <Text className="text-sm font-body-semibold text-error mb-1">30-Minute Grace Period</Text>
            <Text className="text-xs text-on-surface-variant leading-relaxed">
              Cancellations within 30 minutes qualify for a full refund of the ৳50 commitment fee.
            </Text>
          </View>
        </View>

        {/* ── STEP 2: Payment ──────────────────────────────────────────────────── */}
        {step === "payment" && (
          <View className="gap-5 mb-6">
            {/* Payment instructions */}
            <View className="bg-surface-container-low rounded-xl p-5">
              <View className="flex-row gap-4 items-start">
                <View className="bg-secondary-container p-3 rounded-lg">
                  <Text className="text-on-secondary-container text-xl">💳</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-on-surface font-body-semibold text-base mb-4">How to Pay</Text>
                  {[
                    `Send ৳50.00 to ${BKASH_NUMBER} via bKash or Nagad.`,
                    'Use "MH-ORDER" as the reference.',
                    "Copy the Transaction ID (TrxID) and paste below.",
                  ].map((step, i) => (
                    <View key={i} className="flex-row items-start gap-3 mb-3">
                      <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                        <Text className="text-white text-[10px] font-bold">{i + 1}</Text>
                      </View>
                      <Text className="flex-1 text-sm text-on-surface-variant leading-snug">{step}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Payment method selector */}
            <View>
              <Text className="text-[10px] font-label uppercase text-secondary mb-2 ml-1" style={{ letterSpacing: 2 }}>
                Payment Method
              </Text>
              <View className="flex-row gap-3">
                {(["bKash", "Nagad"] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    className="flex-1 h-14 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: paymentMethod === m ? Colors.primaryFixed : Colors.surfaceContainerHigh,
                      borderWidth: paymentMethod === m ? 2 : 0,
                      borderColor: Colors.primary,
                    }}
                  >
                    <Text className="font-body-semibold text-on-surface">{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* TrxID input */}
            <View>
              <Text className="text-[10px] font-label uppercase text-secondary mb-2 ml-1" style={{ letterSpacing: 2 }}>
                Transaction ID (TrxID)
              </Text>
              <TextInput
                className="h-14 bg-surface-container-high rounded-xl px-4 text-on-surface text-base"
                placeholder="e.g. 8N7X9K2P0"
                placeholderTextColor={Colors.outline}
                value={trxId}
                onChangeText={setTrxId}
                autoCapitalize="characters"
              />
            </View>
          </View>
        )}

        {/* ── STEP 3: Done ─────────────────────────────────────────────────────── */}
        {step === "done" && (
          <View className="items-center py-10 gap-4">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-2">
              <Text className="text-4xl">✅</Text>
            </View>
            <Text className="text-2xl font-headline text-on-surface text-center">Order Placed!</Text>
            <Text className="text-on-surface-variant text-sm text-center leading-relaxed px-4">
              Your commitment fee submission has been sent. The admin will verify your TrxID and confirm the order.
            </Text>
            <TouchableOpacity onPress={() => router.replace("/(tabs)/history")} className="mt-4">
              <Text className="text-primary font-body-semibold text-base">Track Your Order →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {step !== "done" && (
        <View
          style={{ paddingBottom: insets.bottom + 16, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: `${Colors.outlineVariant}28` }}
        >
          <TouchableOpacity
            onPress={step === "summary" ? handlePlaceOrder : handleSubmitPayment}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: loading ? 0.7 : 1, shadowColor: Colors.primary, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }}
            >
              {loading ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text style={{ color: Colors.onPrimary, fontWeight: "700", fontSize: 16 }}>
                  {step === "summary" ? "Proceed to Payment ✓" : "Submit Order ✓"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity className="items-center mt-4" onPress={() => router.back()}>
            <Text className="text-on-surface-variant font-body-medium text-sm">← Back to Menu</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
