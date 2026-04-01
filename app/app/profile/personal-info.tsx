import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { getMe, updateMe } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { CustomAlert } from "@/store/alert-store";
import { useKeyboard } from "@/hooks/use-keyboard";

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { setAuth, token } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();

  useEffect(() => {
    getMe()
      .then((profile) => {
        setName(profile.name);
        setPhone(profile.phone);
      })
      .catch(() => {
        CustomAlert.alert("Error", "Could not load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      CustomAlert.alert("Error", "Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMe({ name });
      // update auth store but preserve the token
      if (token) {
        setAuth(updated, token);
      }
      CustomAlert.alert("Success", "Personal info updated successfully", [
        { text: "OK", onPress: () => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile") },
      ]);
    } catch (e: unknown) {
      CustomAlert.alert("Update Failed", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
            Personal Info
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
            Edit Profile
          </Text>
          <Text className="text-sm text-on-surface-variant mb-7">
            Update your personal details below.
          </Text>

          {/* Name Input */}
          <View className="mb-5">
            <Text
              className="text-[11px] font-label uppercase text-on-surface-variant mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Full Name
            </Text>
            <View className="relative">
              <TextInput
                className="h-14 bg-surface-container-high rounded-xl px-4 text-on-surface text-base"
                placeholder="Enter your name"
                placeholderTextColor={Colors.outline}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Phone (Read Only) */}
          <View className="mb-8">
            <Text
              className="text-[11px] font-label uppercase text-on-surface-variant mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Registered Phone
            </Text>
            <View className="relative">
              <TextInput
                className="h-14 bg-surface-container rounded-xl px-4 text-outline text-base"
                value={phone}
                editable={false}
              />
            </View>
            <Text className="text-[10px] text-on-surface-variant mt-2 ml-1">
              Phone number cannot be changed.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85}>
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
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text className="text-on-primary font-headline font-bold text-base">
                  Save Changes
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Footer Link */}
        <View className="items-center mt-8 pb-10">
          <Text className="text-sm text-on-surface-variant">
            Changed your mind?{" "}
            <Text
              className="text-primary font-body-semibold"
              onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
            >
              Go Back
            </Text>
          </Text>
        </View>
        
        {/* Dynamic spacer for keyboard */}
        <View style={{ height: isKeyboardVisible ? keyboardHeight : 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
