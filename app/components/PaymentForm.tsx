import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/constants/colors";
import { submitPayment, uploadPaymentScreenshot, getPaymentNumbers, type PaymentNumber } from "@/lib/api";
import { CustomAlert } from "@/store/alert-store";

interface PaymentFormProps {
  orderId: string;
  initialPaymentMethod?: "bKash" | "Nagad";
  initialTrxId?: string;
  initialScreenshot?: string;
  onSuccess: () => void;
  paddingBottom?: number;
}

export function PaymentForm({
  orderId,
  initialPaymentMethod = "bKash",
  initialTrxId = "",
  initialScreenshot = undefined,
  onSuccess,
  paddingBottom = 0,
}: PaymentFormProps) {
  const [paymentNumbers, setPaymentNumbers] = useState<PaymentNumber[]>([]);
  const [loadingNumbers, setLoadingNumbers] = useState(true);
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [trxId, setTrxId] = useState(initialTrxId);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(initialScreenshot ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPaymentNumbers()
      .then((nums) => {
        setPaymentNumbers(nums);
        // Auto-select the first number matching initialPaymentMethod, or just the first
        const preferred = nums.find((n) => n.type === initialPaymentMethod) ?? nums[0] ?? null;
        if (preferred) setSelectedNumberId(preferred.id);
      })
      .catch(() => {})
      .finally(() => setLoadingNumbers(false));
  }, [initialPaymentMethod]);

  const selectedNumber = paymentNumbers.find((n) => n.id === selectedNumberId) ?? null;

  const handleCopy = async () => {
    if (!selectedNumber) return;
    await Clipboard.setStringAsync(selectedNumber.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      CustomAlert.alert("Permission Denied", "We need camera roll permissions to upload screenshots.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setScreenshotUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedNumberId && paymentNumbers.length > 0) {
      CustomAlert.alert("Select Payment Number", "Please select which number you sent money to.");
      return;
    }
    setSubmitting(true);
    try {
      let uploadedUrl: string | undefined = screenshotUri || undefined;
      if (screenshotUri && !screenshotUri.startsWith("http")) {
        const uploadRes = await uploadPaymentScreenshot(screenshotUri);
        uploadedUrl = uploadRes.url;
      }
      const method = selectedNumber?.type ?? initialPaymentMethod;
      await submitPayment(orderId, trxId.trim(), method, uploadedUrl, selectedNumberId ?? undefined);
      CustomAlert.alert("Success", "Payment info saved successfully!");
      onSuccess();
    } catch (error: any) {
      CustomAlert.alert("Error", error.message || "Failed to submit payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 16,
        padding: 18,
        gap: 16,
        paddingBottom: paddingBottom + 18,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", color: Colors.secondary }}>
        Submit Payment
      </Text>

      {/* Payment number selector */}
      {loadingNumbers ? (
        <ActivityIndicator color={Colors.primary} size="small" />
      ) : paymentNumbers.length === 0 ? (
        <View style={{ backgroundColor: `${Colors.error}10`, borderRadius: 10, padding: 12 }}>
          <Text style={{ fontSize: 13, color: Colors.error }}>No payment numbers configured. Contact admin.</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: Colors.onSurfaceVariant, textTransform: "uppercase" }}>
            Send ৳50 to
          </Text>
          {paymentNumbers.map((pn) => {
            const isSelected = selectedNumberId === pn.id;
            const color = pn.type === "bKash" ? "#e2136e" : "#F7941D";
            return (
              <TouchableOpacity
                key={pn.id}
                onPress={() => setSelectedNumberId(pn.id)}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? color : `${Colors.outlineVariant}40`,
                  backgroundColor: isSelected ? `${color}08` : Colors.surfaceContainerHigh,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: `${color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "800", color }}>{pn.type === "bKash" ? "bK" : "Ng"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: Colors.onSurface, letterSpacing: 0.5 }}>
                    {pn.number}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 1 }}>
                    {pn.type}{pn.label ? ` · ${pn.label}` : ""}
                  </Text>
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={color} />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color={Colors.outline} />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Copy number button */}
          {selectedNumber && (
            <TouchableOpacity
              onPress={handleCopy}
              activeOpacity={0.75}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: Colors.surfaceContainerHigh,
              }}
            >
              <Ionicons
                name={copied ? "checkmark-done-outline" : "copy-outline"}
                size={16}
                color={copied ? "#2e7d32" : Colors.primary}
              />
              <Text style={{ fontSize: 13, fontWeight: "600", color: copied ? "#2e7d32" : Colors.primary }}>
                {copied ? "Copied!" : `Copy ${selectedNumber.number}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* TrxID input */}
      <View>
        <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: Colors.onSurfaceVariant, textTransform: "uppercase", marginBottom: 6, marginLeft: 2 }}>
          Transaction ID
        </Text>
        <TextInput
          style={{
            height: 48,
            backgroundColor: Colors.surfaceContainerHigh,
            borderRadius: 10,
            paddingHorizontal: 16,
            fontSize: 15,
            fontWeight: "600",
            color: Colors.onSurface,
            letterSpacing: 0.5,
          }}
          placeholder="e.g. 8N7A2BC3DX"
          placeholderTextColor={Colors.outline}
          value={trxId}
          onChangeText={setTrxId}
          autoCapitalize="characters"
          returnKeyType="done"
        />
      </View>

      {/* Screenshot attachment */}
      <View>
        <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: Colors.onSurfaceVariant, textTransform: "uppercase", marginBottom: 6, marginLeft: 2 }}>
          Attach Screenshot (Optional)
        </Text>
        <TouchableOpacity
          onPress={handlePickImage}
          activeOpacity={0.7}
          style={{
            height: screenshotUri ? 120 : 60,
            backgroundColor: Colors.surfaceContainerHigh,
            borderRadius: 10,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: screenshotUri ? Colors.primary : `${Colors.outlineVariant}60`,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {screenshotUri ? (
            <Image source={{ uri: screenshotUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="image-outline" size={20} color={Colors.outline} />
              <Text style={{ fontSize: 13, color: Colors.outline }}>Tap to select image</Text>
            </View>
          )}
          {screenshotUri && (
            <TouchableOpacity
              onPress={() => setScreenshotUri(null)}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(0,0,0,0.5)",
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>

      {/* Submit button */}
      <TouchableOpacity onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 50,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            opacity: submitting ? 0.7 : 1,
            marginTop: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.onPrimary} />
          ) : (
            <Text style={{ color: Colors.onPrimary, fontWeight: "700", fontSize: 15 }}>
              Submit Payment
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
