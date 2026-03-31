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

type LocationData = {
  address: string;
  lat?: number;
  lng?: number;
};

export default function SavedLocationsScreen() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMe()
      .then((profile) => {
        const loc = profile.locationData as LocationData | null;
        if (loc?.address) {
          setAddress(loc.address);
        }
      })
      .catch(() => {
        Alert.alert("Error", "Could not load saved locations");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert("Error", "Address cannot be empty");
      return;
    }

    setSaving(true);
    try {
      // Keep it simple for this implementation: store just the address
      const locationData: LocationData = {
        address: address.trim(),
        lat: 24.7471, // Mock Mymensingh coordinate
        lng: 90.4203,
      };

      await updateMe({ locationData });
      
      Alert.alert("Success", "Delivery location updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      Alert.alert("Update Failed", e instanceof Error ? e.message : "Something went wrong.");
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
            Delivery Address
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
            Saved Location
          </Text>
          <Text className="text-sm text-on-surface-variant mb-7">
            Provide your default delivery address in Mymensingh area.
          </Text>

          {/* Address Input */}
          <View className="mb-8">
            <Text
              className="text-[11px] font-label uppercase text-on-surface-variant mb-2 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Delivery Address
            </Text>
            <View className="relative">
              <TextInput
                className="bg-surface-container-high rounded-xl p-4 text-on-surface text-base"
                placeholder="e.g. 15 RK Mission Road, Flat 3B"
                placeholderTextColor={Colors.outline}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />
            </View>
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
                  Save Address
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
              onPress={() => router.back()}
            >
              Go Back
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
