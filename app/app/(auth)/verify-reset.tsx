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
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { resetPassword } from "@/lib/api";

export default function VerifyResetScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!otp.trim()) {
      Alert.alert("Missing field", "Please enter the 4-digit code.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { message } = await resetPassword(phone || "", password);
      Alert.alert("Success", message || "Password has been successfully reset. Please login with your new password.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: unknown) {
      Alert.alert("Reset Failed", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
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
            Create New Password
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
            Verify & Reset
          </Text>
          <Text className="text-sm text-on-surface-variant mb-7">
            A 4-digit code was sent to +880 {phone}. Enter it along with your new password. (Use 1234 for testing)
          </Text>

          {/* OTP Input */}
          <View className="mb-5">
            <Text
              className="text-[11px] font-label uppercase text-on-surface-variant mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              4-Digit Code
            </Text>
            <TextInput
              className="h-14 bg-surface-container-high rounded-xl px-4 text-on-surface text-base tracking-[0.2em] font-headline"
              placeholder="0000"
              placeholderTextColor={Colors.outline}
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
              autoCapitalize="none"
              textAlign="center"
            />
          </View>

          {/* New Password */}
          <View className="mb-8">
            <Text
              className="text-[11px] font-label uppercase text-on-surface-variant mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              New Password
            </Text>
            <View className="relative">
              <TextInput
                className="h-14 bg-surface-container-high rounded-xl pl-4 pr-14 text-on-surface text-base"
                placeholder="••••••••"
                placeholderTextColor={Colors.outline}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                className="absolute right-4 top-0 bottom-0 justify-center"
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text className="text-outline text-sm">
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity onPress={handleReset} disabled={loading} activeOpacity={0.85}>
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
                {loading ? "Resetting..." : "Reset Password"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <View className="items-center mt-8 pb-10">
          <Text className="text-sm text-on-surface-variant">
            Back to{" "}
            <Text
              className="text-primary font-body-semibold"
              onPress={() => router.replace("/(auth)/login")}
            >
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
