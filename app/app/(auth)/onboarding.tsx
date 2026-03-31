import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface">
      {/* Hero image section */}
      <View className="h-[360px] bg-surface-container-low overflow-hidden">
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800" }}
          className="w-full h-full"
          resizeMode="cover"
          style={{ opacity: 0.85 }}
        />
        {/* Frosted glass header */}
        <View
          className="absolute top-0 left-0 right-0 px-6 pt-12 pb-4 flex-row justify-between items-center"
          style={{ backgroundColor: "rgba(251,249,245,0.75)" }}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-xl font-headline-extra tracking-tight text-primary">
              Matir Hari
            </Text>
          </View>
          <Text
            className="text-secondary text-[11px] font-label uppercase"
            style={{ letterSpacing: 2 }}
          >
            Mymensingh Heritage
          </Text>
        </View>

        {/* Trust score badge */}
        <View className="absolute bottom-8 right-5 bg-surface-container-lowest p-4 rounded-xl flex-row items-center gap-3"
          style={{ shadowColor: Colors.primary, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 }}>
          <View className="w-12 h-12 items-center justify-center">
            <Text className="text-secondary font-label font-extrabold text-lg">9.8</Text>
          </View>
          <View>
            <Text className="text-[11px] font-label uppercase text-secondary" style={{ letterSpacing: 2 }}>
              Trust Score
            </Text>
            <Text className="text-xs text-on-surface-variant">Authentic Hand-Cooked</Text>
          </View>
        </View>
      </View>

      {/* Content card */}
      <View className="flex-1 -mt-6 bg-surface rounded-t-[28px] px-6 pt-8 pb-8">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text
            className="text-[34px] font-headline-extra leading-tight text-primary mb-3"
            style={{ letterSpacing: -1 }}
          >
            Authentic Bengali{"\n"}Meals, Daily.
          </Text>
          <Text className="text-on-surface-variant text-base leading-relaxed mb-8">
            Experience the soul of Mymensingh with our curated{" "}
            <Text className="text-secondary font-body-semibold">Fixed Daily Meals</Text>
            . No menus, just the freshest Lunch and Dinner, slow-cooked in traditional clay pots.
          </Text>

          {/* Feature cards */}
          <View className="gap-3 mb-8">
            <View className="bg-surface-container-low p-5 rounded-xl flex-row gap-4 items-start">
              <View className="bg-primary/10 p-3 rounded-lg">
                <Text className="text-primary text-xl">🍚</Text>
              </View>
              <View className="flex-1">
                <Text className="text-on-surface font-body-semibold text-base mb-1">
                  Fixed Daily Lunch &amp; Dinner
                </Text>
                <Text className="text-on-surface-variant text-sm leading-relaxed">
                  Balanced menus designed weekly, delivered fresh from the kiln-fired kitchen.
                </Text>
              </View>
            </View>

            <View className="bg-surface-container-low p-5 rounded-xl flex-row gap-4 items-start">
              <View className="bg-secondary/10 p-3 rounded-lg">
                <Text className="text-secondary text-xl">⭐</Text>
              </View>
              <View className="flex-1">
                <Text className="text-on-surface font-body-semibold text-base mb-1">
                  Elite Trust Score System
                </Text>
                <Text className="text-on-surface-variant text-sm leading-relaxed">
                  5 successful orders unlocks Cash on Delivery — no commitment fee needed.
                </Text>
              </View>
            </View>
          </View>

          {/* Commitment fee note */}
          <View className="bg-surface-container-high/60 p-4 rounded-xl mb-8 border border-outline-variant/20">
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-secondary text-base">ℹ️</Text>
              <Text
                className="text-[11px] font-label uppercase text-on-surface-variant"
                style={{ letterSpacing: 1.5 }}
              >
                Membership Note
              </Text>
            </View>
            <Text className="text-on-surface-variant text-sm leading-relaxed">
              A non-refundable{" "}
              <Text className="font-body-semibold text-primary">৳50 commitment fee</Text>
              {" "}is required per order to secure your kitchen slot. Refundable within 30 minutes.
            </Text>
          </View>

          {/* CTAs */}
          <View className="gap-3">
            <TouchableOpacity onPress={() => router.push("/(auth)/signup")} activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="h-14 rounded-xl items-center justify-center flex-row gap-2"
                style={{ shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}
              >
                <Text className="text-on-primary font-headline text-base font-bold">
                  Get Started →
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              className="h-14 items-center justify-center rounded-xl"
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.7}
            >
              <Text className="text-primary font-body-semibold text-base">
                Already have an account? Log in
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ornament */}
          <View className="mt-10 flex-row items-center justify-center gap-3 opacity-20">
            <View className="h-[1px] w-16 bg-outline-variant" />
            <View className="flex-row gap-1">
              <View className="w-2 h-2 rounded-full bg-primary" />
              <View className="w-2 h-2 rounded-full bg-secondary" />
              <View className="w-2 h-2 rounded-full bg-primary" />
            </View>
            <View className="h-[1px] w-16 bg-outline-variant" />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
