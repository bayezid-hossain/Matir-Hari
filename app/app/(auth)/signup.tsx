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
import { register } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { CustomAlert } from "@/store/alert-store";

export default function SignupScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim()) return CustomAlert.alert("Missing field", "Please enter your name.");
    if (!phone.trim()) return CustomAlert.alert("Missing field", "Please enter your phone number.");
    if (password.length < 6) return CustomAlert.alert("Weak password", "Password must be at least 6 characters.");
    if (!agreed) return CustomAlert.alert("Terms", "Please accept the Terms & Conditions.");

    setLoading(true);
    try {
      const { user, token } = await register(name.trim(), phone.trim(), password);
      await setAuth(user, token);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      CustomAlert.alert("Sign Up Failed", e instanceof Error ? e.message : "Something went wrong.");
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
      >
        {/* Left branding panel — condensed on mobile */}
        <View className="bg-surface-container-low px-6 pt-14 pb-8">
          <Text
            className="text-3xl font-headline-extra text-primary tracking-tight mb-1"
            style={{ letterSpacing: -0.5 }}
          >
            Matir Hari
          </Text>
          <Text
            className="text-[11px] font-label uppercase text-secondary mb-5"
            style={{ letterSpacing: 3 }}
          >
            Authentic Mymensingh Heritage
          </Text>
          <Text className="text-3xl font-headline text-on-surface leading-tight">
            Join the{" "}
            <Text className="text-primary-container">Mymensingh</Text>
            {"\n"}community
          </Text>
          <Text className="text-on-surface-variant mt-3 text-base leading-relaxed">
            From earthen pots to your dining table. Experience artisanal flavours of tradition.
          </Text>
        </View>

        {/* Form section */}
        <View className="bg-surface-container-lowest flex-1 px-6 py-8">
          <Text className="text-2xl font-headline text-on-surface mb-1">
            Create your account
          </Text>
          <Text className="text-on-surface-variant font-body-medium mb-7">
            Start your journey into authentic tastes.
          </Text>

          {/* Full Name */}
          <View className="mb-5">
            <Text
              className="text-[11px] font-label uppercase text-secondary mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Full Name
            </Text>
            <TextInput
              className="h-14 bg-surface-container-high rounded-xl px-4 text-on-surface text-base"
              placeholder="Arif Ahmed"
              placeholderTextColor={Colors.outline}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Phone */}
          <View className="mb-5">
            <Text
              className="text-[11px] font-label uppercase text-secondary mb-2 ml-1"
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
              />
            </View>
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text
              className="text-[11px] font-label uppercase text-secondary mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Password
            </Text>
            <TextInput
              className="h-14 bg-surface-container-high rounded-xl px-4 text-on-surface text-base"
              placeholder="Min. 6 characters"
              placeholderTextColor={Colors.outline}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Terms */}
          <TouchableOpacity
            className="flex-row gap-3 items-start mb-8"
            onPress={() => setAgreed((v) => !v)}
            activeOpacity={0.7}
          >
            <View
              className="w-5 h-5 rounded border-2 mt-0.5 items-center justify-center"
              style={{
                borderColor: agreed ? Colors.primary : Colors.outline,
                backgroundColor: agreed ? Colors.primary : "transparent",
              }}
            >
              {agreed && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
            <Text className="flex-1 text-sm text-on-surface-variant leading-snug">
              I agree to the{" "}
              <Text className="text-primary font-body-semibold">Terms &amp; Conditions</Text>
              {" "}and{" "}
              <Text className="text-primary font-body-semibold">Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
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
                  Create Account →
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login link */}
          <View className="items-center mt-7">
            <Text className="text-on-surface-variant text-sm">
              Already have an account?{" "}
              <Text
                className="text-primary font-body-semibold"
                onPress={() => router.push("/(auth)/login")}
              >
                Login
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
