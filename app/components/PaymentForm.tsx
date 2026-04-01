import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/colors";
import { submitPayment, uploadPaymentScreenshot } from "@/lib/api";
import { CustomAlert } from "@/store/alert-store";

interface PaymentFormProps {
  orderId: string;
  initialPaymentMethod?: "bKash" | "Nagad";
  onSuccess: () => void;
  paddingBottom?: number;
}

export function PaymentForm({
  orderId,
  initialPaymentMethod = "bKash",
  onSuccess,
  paddingBottom = 0,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<"bKash" | "Nagad">(initialPaymentMethod);
  const [trxId, setTrxId] = useState("");
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!trxId.trim()) {
      CustomAlert.alert("Error", "Please enter your Transaction ID.");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedUrl: string | undefined;
      if (screenshotUri) {
        const uploadRes = await uploadPaymentScreenshot(screenshotUri);
        uploadedUrl = uploadRes.url;
      }

      await submitPayment(orderId, trxId.trim(), paymentMethod, uploadedUrl);
      CustomAlert.alert("Success", "Payment submitted successfully!");
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
        gap: 14,
        paddingBottom: paddingBottom + 18,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", color: Colors.secondary }}>
        Submit Payment
      </Text>

      {/* Payment method selector */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {(["bKash", "Nagad"] as const).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setPaymentMethod(m)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: paymentMethod === m ? Colors.primary : Colors.surfaceContainerHigh,
              borderWidth: paymentMethod === m ? 0 : 1,
              borderColor: `${Colors.outlineVariant}40`,
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 14, color: paymentMethod === m ? Colors.onPrimary : Colors.onSurfaceVariant }}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
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
