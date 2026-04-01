import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import MapView, { Marker, type Region } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import {
  getMe,
  updateMe,
  type LocationData,
  type SavedLocation,
} from "@/lib/api";

// Mymensingh city center
const DEFAULT_LAT = 24.7471;
const DEFAULT_LNG = 90.4203;

export default function LocationPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [region, setRegion] = useState<Region>({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markerCoord, setMarkerCoord] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
  });
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const handleMarkerDrag = (e: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });
    // Auto-fill with coordinates; user can override with a typed address
    setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert("Label required", 'Enter a name like "Home" or "Work".');
      return;
    }

    setSaving(true);
    try {
      const profile = await getMe();
      const raw = profile.locationData;
      const existing: LocationData =
        raw && "locations" in (raw as object)
          ? (raw as LocationData)
          : { locations: [], activeId: null };

      const newLocation: SavedLocation = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        label: label.trim(),
        address:
          address.trim() ||
          `${markerCoord.latitude.toFixed(5)}, ${markerCoord.longitude.toFixed(5)}`,
        lat: markerCoord.latitude,
        lng: markerCoord.longitude,
      };

      const updated: LocationData = {
        locations: [...existing.locations, newLocation],
        // Set as active if it's the first location
        activeId: existing.activeId ?? newLocation.id,
      };

      await updateMe({ locationData: updated });
      router.back();
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to save location."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View
        className="px-5 pb-4 flex-row items-center justify-between"
        style={{
          paddingTop: insets.top + 8,
          backgroundColor: "rgba(251,249,245,0.97)",
          shadowColor: Colors.primary,
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-primary font-body-semibold text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-lg font-headline text-on-surface">Pick Location</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Map */}
      <MapView
        style={{ flex: 1 }}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker
          coordinate={markerCoord}
          draggable
          onDragEnd={handleMarkerDrag}
          pinColor={Colors.primary}
        />
      </MapView>

      {/* Bottom panel */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="bg-surface px-5 pt-5 gap-4"
          style={{
            paddingBottom: insets.bottom + 16,
            shadowColor: Colors.primary,
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <Text
            className="text-[10px] font-label uppercase text-secondary"
            style={{ letterSpacing: 2 }}
          >
            Drag the pin to your delivery spot
          </Text>

          {/* Label */}
          <View>
            <Text
              className="text-[10px] font-label uppercase text-on-surface-variant mb-1 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Location Label
            </Text>
            <TextInput
              className="h-12 bg-surface-container-high rounded-xl px-4 text-on-surface text-base"
              placeholder='e.g. Home, Work, Mama&apos;s House'
              placeholderTextColor={Colors.outline}
              value={label}
              onChangeText={setLabel}
            />
          </View>

          {/* Address */}
          <View>
            <Text
              className="text-[10px] font-label uppercase text-on-surface-variant mb-1 ml-1"
              style={{ letterSpacing: 1.5 }}
            >
              Address Description
            </Text>
            <TextInput
              className="h-12 bg-surface-container-high rounded-xl px-4 text-on-surface text-base"
              placeholder="e.g. 15 RK Mission Road, Flat 3B"
              placeholderTextColor={Colors.outline}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 54,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                opacity: saving ? 0.7 : 1,
                shadowColor: Colors.primary,
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              {saving ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text
                  style={{
                    color: Colors.onPrimary,
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  Save Location
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
