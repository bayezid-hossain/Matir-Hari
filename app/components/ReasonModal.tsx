import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useKeyboard } from "@/hooks/use-keyboard";
import { CustomAlert } from "@/store/alert-store";

interface ReasonModalProps {
  visible: boolean;
  title: string;
  subtitle: string;
  confirmLabel: string;
  confirmColor: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onDismiss: () => void;
}

export function ReasonModal({
  visible,
  title,
  subtitle,
  confirmLabel,
  confirmColor,
  loading = false,
  onConfirm,
  onDismiss,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const insets = useSafeAreaInsets();
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();

  const handleConfirm = () => {
    if (!reason.trim()) {
      CustomAlert.alert("Required", "Please enter a reason.");
      return;
    }
    onConfirm(reason.trim());
    setReason("");
  };

  const handleDismiss = () => {
    setReason("");
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
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20 }}>
            {subtitle}
          </Text>

          <TextInput
            style={{
              backgroundColor: Colors.surfaceContainerHigh,
              borderRadius: 12,
              padding: 14,
              fontSize: 15,
              color: Colors.onSurface,
              minHeight: 100,
              textAlignVertical: "top",
            }}
            placeholder="Enter reason…"
            placeholderTextColor={Colors.outline}
            value={reason}
            onChangeText={setReason}
            multiline
            autoFocus
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
                backgroundColor: loading ? `${confirmColor}50` : confirmColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
