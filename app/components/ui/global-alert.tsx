import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useAlertStore } from "@/store/alert-store";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";

export function GlobalAlert() {
  const { visible, title, message, buttons, options, hideAlert } =
    useAlertStore();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) });
      scale.value = withTiming(0.9, { duration: 200, easing: Easing.in(Easing.ease) });
    }
  }, [visible]);

  // Removed early return to ensure consistent hook call order

  const defaultButtons: import("@/store/alert-store").AlertButton[] = [{ text: "OK", onPress: () => {} }];
  const actionButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

  const handlePress = (onPress?: () => void) => {
    hideAlert();
    if (onPress) {
      setTimeout(onPress, 50);
    }
  };

  const handleBackgroundPress = () => {
    if (options?.cancelable !== false) {
      hideAlert();
    }
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  // Prevent rendering Modal when fully hidden to avoid z-index blocking issues
  if (!visible && opacity.value === 0) return null;

  return (
    <Modal transparent visible={visible || opacity.value > 0} animationType="none">
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <Animated.View style={[{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.45)", justifyContent: "center", alignItems: "center" }, backdropStyle]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View style={[
              {
                width: Dimensions.get("window").width * 0.82,
                backgroundColor: "white",
                borderRadius: 24,
                overflow: "hidden",
                alignItems: "center",
                paddingTop: 24,
                elevation: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
              },
              popupStyle
            ]}>
              <View style={{ paddingHorizontal: 24, alignItems: "center", marginBottom: 24 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: "#1F2937", textAlign: "center", marginBottom: 8 }}>
                  {title}
                </Text>
                {message && (
                  <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 16, color: "#6B7280", textAlign: "center", lineHeight: 22 }}>
                    {message}
                  </Text>
                )}
              </View>

              <View style={{ width: "100%", flexDirection: actionButtons.length > 2 ? "column" : "row", borderTopWidth: 1, borderColor: "#F3F4F6", marginTop: -8 }}>
                {actionButtons.map((btn, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => handlePress(btn.onPress)}
                    style={{
                      flex: actionButtons.length > 2 ? undefined : 1,
                      paddingVertical: 18,
                      borderLeftWidth: index > 0 && actionButtons.length <= 2 ? 1 : 0,
                      borderTopWidth: index > 0 && actionButtons.length > 2 ? 1 : 0,
                      borderColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{
                      fontFamily: btn.style === "cancel" || btn.style === "destructive" ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_700Bold",
                      fontSize: 16,
                      color: btn.style === "destructive" ? "#EF4444" : btn.style === "cancel" ? "#6B7280" : "#10B981"
                    }}>
                      {btn.text || "OK"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
