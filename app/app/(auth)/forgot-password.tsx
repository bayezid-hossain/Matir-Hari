import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { CustomAlert } from "@/store/alert-store";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (!phone.trim()) {
      CustomAlert.alert("Missing field", "Please enter your registered phone number.");
      return;
    }
    
    // In a full implementation, we would call an API to generate & send an OTP via SMS here.
    // For this flow, we simulate sending the OTP and proceed to the verification screen.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Navigate to verify-reset passing the phone number as a parameter
      router.push({
        pathname: "/(auth)/verify-reset",
        params: { phone: phone.trim() },
      });
    }, 600); // simulate network delay
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        {/* Header Branding */}
        <View className="items-center pt-20 pb-10">
          <Text className="text-4xl font-headline-extra tracking-tight text-primary mb-1" style={{ letterSpacing: -1 }}>
            Matir Hari
          </Text>
          <Text
            className="text-[11px] font-label uppercase text-secondary"
            style={{ letterSpacing: 3 }}
          >
            Password Recovery
          </Text>
        </View>

        {/* Card */}
        <View
          className="mx-5 bg-surface-container-lowest rounded-3xl p-7"
          style={{
            shadowColor: Colors.primary,
            shadowOpacity: 0.06,
            shadowRadius: 24,
            elevation: 4,
          }}
        >
          <Text className="text-2xl font-headline text-on-surface mb-1">
            Forgot Password
          </Text>
          <Text className="text-sm text-on-surface-variant mb-7">
            Enter your phone number right below to receive a reset code.
          </Text>

          {/* Phone Input */}
          <View className="mb-8">
            <Text
              className="text-[11px] font-label uppercase text-on-surface-variant mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Registered Phone Number
            </Text>
            <View className="flex-row gap-2">
              <View className="h-14 bg-surface-container px-4 rounded-xl justify-center border border-outline-variant/20">
                <Text className="text-on-surface font-body-medium">+880</Text>
              </View>
              <TextInput
                className="flex-1 h-14 bg-surface-container-high rounded-xl px-4 text-on-surface text-base"
                placeholder="1XXX XXXXXX"
                placeholderTextColor={Colors.outline}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity onPress={handleNext} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-14 rounded-xl items-center justify-center flex-row gap-2"
              style={{
                shadowColor: Colors.primary,
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 6,
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Text className="text-on-primary font-headline font-bold text-base">
                {loading ? "Sending Code..." : "Send Reset Code →"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View className="items-center mt-8 pb-10">
          <Text className="text-sm text-on-surface-variant">
            Remembered your password?{" "}
            <Text
              className="text-primary font-body-semibold"
              onPress={() => router.canGoBack() ? router.back() : router.replace("/(auth)/login")}
            >
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
