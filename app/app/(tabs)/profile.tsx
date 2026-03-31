import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getMe, type UserProfile } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

function TrustScoreRing({ score, total = 5 }: { score: number; total?: number }) {
  const pct = Math.min(score / total, 1);
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;

  return (
    <View style={{ width: 72, height: 72, alignItems: "center", justifyContent: "center" }}>
      {/* Simple circle using borders */}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 5,
          borderColor: Colors.secondaryFixedDim,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Overlay arc — approximated with a colored arc using rotation */}
        <View
          style={{
            position: "absolute",
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 5,
            borderColor: "transparent",
            borderTopColor: Colors.secondary,
            transform: [{ rotate: `-90deg` }],
          }}
        />
        <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.secondary }}>
          {score}/{total}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setProfile)
      .catch(() => { /* offline fallback */ })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/(auth)/onboarding");
        },
      },
    ]);
  };

  const displayName = profile?.name ?? user?.name ?? "—";
  const displayPhone = profile?.phone ?? user?.phone ?? "—";
  const trustScore = profile?.trustScore ?? user?.trustScore ?? 0;
  const perks = profile?.perks ?? {
    codUnlocked: trustScore >= 5,
    ordersUntilCod: Math.max(0, 5 - trustScore),
    progressPercent: Math.min(100, trustScore * 20),
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8, backgroundColor: "rgba(251,249,245,0.95)", shadowColor: Colors.primary, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 }}
        className="px-5 pb-4 flex-row items-center justify-between"
      >
        <View className="flex-row items-center gap-1">
          <Text>📍</Text>
          <Text className="text-xl font-headline-extra text-primary" style={{ letterSpacing: -0.5 }}>Matir Hari</Text>
        </View>
        <Text className="text-secondary font-body-semibold text-sm">Mymensingh</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Profile header */}
            <View className="items-center py-6 gap-3">
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  padding: 3,
                  backgroundColor: Colors.primary,
                  shadowColor: Colors.primary,
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <View
                  style={{ width: "100%", height: "100%", borderRadius: 44, backgroundColor: Colors.surfaceContainerHigh, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ fontSize: 36 }}>👤</Text>
                </View>
              </View>
              <Text className="text-3xl font-headline-extra text-on-surface" style={{ letterSpacing: -0.5 }}>{displayName}</Text>
              <Text className="text-on-surface-variant font-body-medium">{displayPhone}</Text>
            </View>

            {/* Trust score card */}
            <View
              className="bg-surface-container-low rounded-2xl p-6 mb-4 overflow-hidden"
              style={{ shadowColor: Colors.secondary, shadowOpacity: 0.08, shadowRadius: 16, elevation: 2 }}
            >
              <View className="absolute top-0 right-0 w-24 h-24 rounded-full" style={{ backgroundColor: `${Colors.secondary}08`, marginRight: -12, marginTop: -12 }} />
              <View className="flex-row justify-between items-start mb-5">
                <View>
                  <Text className="text-[10px] font-label uppercase text-secondary mb-1" style={{ letterSpacing: 2 }}>Trust Score</Text>
                  <Text className="text-2xl font-headline text-on-surface">
                    {perks.codUnlocked ? "Gold Member 🏅" : "Silver Member"}
                  </Text>
                </View>
                <TrustScoreRing score={Math.min(trustScore, 5)} />
              </View>

              {/* Progress bar */}
              <View className="w-full bg-surface-variant rounded-full h-3 overflow-hidden mb-4">
                <View
                  style={{
                    height: "100%",
                    width: `${perks.progressPercent}%`,
                    borderRadius: 9999,
                    backgroundColor: Colors.secondary,
                  }}
                />
              </View>

              {/* Perk info */}
              <View
                className="bg-surface-container-highest rounded-xl p-4"
                style={{ borderWidth: 1, borderColor: `${Colors.outlineVariant}28` }}
              >
                <View className="flex-row gap-3 items-start">
                  <Text className="text-secondary text-lg">🏆</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-body-semibold text-on-surface mb-1">
                      {perks.codUnlocked ? "COD Unlocked!" : "Unlock COD Benefits"}
                    </Text>
                    <Text className="text-xs text-on-surface-variant leading-relaxed">
                      {perks.codUnlocked
                        ? "The ৳50 advance is waived for you. Enjoy one-tap Cash on Delivery ordering!"
                        : `Complete ${perks.ordersUntilCod} more successful order${perks.ordersUntilCod !== 1 ? "s" : ""} to waive the ৳50 advance payment.`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Settings menu */}
            <Text className="text-[10px] font-label uppercase text-on-surface-variant mb-3 px-1" style={{ letterSpacing: 2 }}>
              Account Settings
            </Text>
            <View className="bg-surface-container-low rounded-2xl overflow-hidden mb-4">
              {[
                { icon: "👤", label: "Edit Personal Info", action: () => {} },
                { icon: "📍", label: "Manage Saved Locations", action: () => {} },
                { icon: "🔔", label: "Notifications", action: () => {} },
              ].map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.action}
                  className="flex-row items-center justify-between p-5"
                  style={i > 0 ? { borderTopWidth: 1, borderTopColor: `${Colors.outlineVariant}18` } : {}}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-4">
                    <View className="w-10 h-10 rounded-xl bg-primary-fixed items-center justify-center">
                      <Text>{item.icon}</Text>
                    </View>
                    <Text className="font-body-semibold text-on-surface">{item.label}</Text>
                  </View>
                  <Text className="text-outline text-lg">›</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-center gap-2 p-4 rounded-2xl"
              style={{ backgroundColor: Colors.surfaceContainerHigh }}
              activeOpacity={0.7}
            >
              <Text className="text-error">🚪</Text>
              <Text className="text-error font-body-semibold text-base">Log Out</Text>
            </TouchableOpacity>

            {/* Craft footer */}
            <View className="items-center mt-10 mb-4 opacity-30">
              <Text className="text-2xl mb-1">🏺</Text>
              <Text className="text-[10px] font-label uppercase text-outline" style={{ letterSpacing: 3 }}>
                Handcrafted in Mymensingh
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
