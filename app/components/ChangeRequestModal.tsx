import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useKeyboard } from "@/hooks/use-keyboard";
import { CustomAlert } from "@/store/alert-store";

interface ChangeRequestModalProps {
  visible: boolean;
  currentQuantity: number;
  loading?: boolean;
  onConfirm: (reason: string, requestedQuantity: number) => void;
  onDismiss: () => void;
}

export function ChangeRequestModal({
  visible,
  currentQuantity,
  loading = false,
  onConfirm,
  onDismiss,
}: ChangeRequestModalProps) {
  const [reason, setReason] = useState("");
  const [quantity, setQuantity] = useState(currentQuantity);
  const insets = useSafeAreaInsets();
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();

  const handleConfirm = () => {
    if (!reason.trim()) {
      CustomAlert.alert("Required", "Please provide a reason for the change.");
      return;
    }
    onConfirm(reason.trim(), quantity);
    setReason("");
    setQuantity(currentQuantity);
  };

  const handleDismiss = () => {
    setReason("");
    setQuantity(currentQuantity);
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
        activeOpacity={1}
        onPress={handleDismiss}
      />

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: isKeyboardVisible ? keyboardHeight : 0,
        }}
      >
        <View
          style={{
            backgroundColor: Colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
            gap: 16,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.outlineVariant,
              alignSelf: "center",
              marginBottom: 4,
            }}
          />

          <Text style={{ fontSize: 18, fontWeight: "800", color: Colors.onSurface }}>
            Request Change
          </Text>
          <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20 }}>
            Specify the new quantity and describe your change. The admin will review and approve or reject it.
          </Text>

          {/* Quantity stepper */}
          <View>
            <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: Colors.onSurfaceVariant, textTransform: "uppercase", marginBottom: 10 }}>
              Platters
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 0 }}>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: Colors.surfaceContainerHigh,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="remove" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
              <View
                style={{
                  flex: 1,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.surfaceContainerLow,
                  marginHorizontal: 8,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.primary }}>
                  {quantity}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setQuantity((q) => Math.min(10, q + 1))}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: Colors.surfaceContainerHigh,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Reason */}
          <TextInput
            style={{
              backgroundColor: Colors.surfaceContainerHigh,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: Colors.onSurface,
              minHeight: 80,
              textAlignVertical: "top",
            }}
            placeholder="Reason for change…"
            placeholderTextColor={Colors.outline}
            value={reason}
            onChangeText={setReason}
            multiline
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleDismiss}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                backgroundColor: Colors.surfaceContainerHigh,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: Colors.onSurfaceVariant, fontWeight: "600", fontSize: 15 }}>
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={loading}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 12,
                backgroundColor: loading ? `${Colors.primary}50` : Colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                  Send Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
