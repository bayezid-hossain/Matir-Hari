import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getMe, updateMe } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setAuth, token } = useAuthStore();
  const [name, setName] = useState(user?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.name) {
      setLoading(true);
      getMe()
        .then((p) => setName(p.name))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Required", "Name cannot be empty.");
    setSaving(true);
    try {
      const updated = await updateMe({ name: name.trim() });
      // Sync store
      if (user && token) {
        await setAuth({ ...user, name: updated.name }, token);
      }
      Alert.alert("Saved", "Your name has been updated.", [{ text: "OK", onPress: () => router.back() }]);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          backgroundColor: Colors.surface,
          shadowColor: Colors.primary,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.surfaceContainerLow,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 18, color: Colors.onSurface }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "800", color: Colors.primary, letterSpacing: -0.5, flex: 1 }}>
          Edit Personal Info
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Avatar placeholder */}
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: Colors.surfaceContainerHigh,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: Colors.primary,
                }}
              >
                <Text style={{ fontSize: 36 }}>👤</Text>
              </View>
              <TouchableOpacity style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: "600" }}>
                  Change Photo (coming soon)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name field */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: Colors.secondary,
                  marginLeft: 4,
                }}
              >
                Full Name
              </Text>
              <TextInput
                style={{
                  height: 56,
                  backgroundColor: Colors.surfaceContainerHigh,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  color: Colors.onSurface,
                }}
                placeholder="Your full name"
                placeholderTextColor={Colors.outline}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Phone (read-only) */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  color: Colors.secondary,
                  marginLeft: 4,
                }}
              >
                Phone Number
              </Text>
              <View
                style={{
                  height: 56,
                  backgroundColor: Colors.surfaceContainerLowest,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: `${Colors.outlineVariant}40`,
                }}
              >
                <Text style={{ fontSize: 16, color: Colors.outline }}>
                  {user?.phone ?? "—"}
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: Colors.outline, marginLeft: 4 }}>
                Phone number cannot be changed.
              </Text>
            </View>

            {/* Save button */}
            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 56,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: saving ? 0.7 : 1,
                  shadowColor: Colors.primary,
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.onPrimary} />
                ) : (
                  <Text style={{ color: Colors.onPrimary, fontWeight: "700", fontSize: 16 }}>
                    Save Changes
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
