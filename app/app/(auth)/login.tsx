import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { login } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { CustomAlert } from "@/store/alert-store";

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      CustomAlert.alert("Missing fields", "Please enter your phone number and password.");
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await login(phone.trim(), password);
      await setAuth(user, token);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      CustomAlert.alert("Login Failed", e instanceof Error ? e.message : "Something went wrong.");
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
        {/* Header branding */}
        <View className="items-center pt-20 pb-10">
          <Text className="text-4xl font-headline-extra tracking-tight text-primary mb-1" style={{ letterSpacing: -1 }}>
            Matir Hari
          </Text>
          <Text
            className="text-[11px] font-label uppercase text-secondary"
            style={{ letterSpacing: 3 }}
          >
            Authentic Bengali Heritage
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
            Welcome Back
          </Text>
          <Text className="text-sm text-on-surface-variant mb-7">
            Enter your credentials to continue.
          </Text>

          {/* Phone */}
          <View className="mb-5">
            <Text
              className="text-[11px] font-label uppercase text-on-surface-variant mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Phone Number
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

          {/* Password */}
          <View className="mb-7">
            <View className="flex-row justify-between items-center mb-2 ml-1 mr-1">
              <Text
                className="text-[11px] font-label uppercase text-on-surface-variant"
                style={{ letterSpacing: 1.5 }}
              >
                Password
              </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
                <Text
                  className="text-[11px] font-label uppercase text-primary"
                  style={{ letterSpacing: 1 }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
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

          {/* Submit */}
          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
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
              {loading ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text className="text-on-primary font-headline font-bold text-base">
                  Login →
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center mt-8 pb-10">
          <Text className="text-sm text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Text
              className="text-primary font-body-semibold"
              onPress={() => router.push("/(auth)/signup")}
            >
              Create Account
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
