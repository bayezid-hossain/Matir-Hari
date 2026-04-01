import { Colors } from "@/constants/colors";
import { useKeyboard } from "@/hooks/use-keyboard";
import {
  getMe,
  updateMe,
  type LocationData,
  type SavedLocation,
} from "@/lib/api";
import { CustomAlert } from "@/store/alert-store";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, type Region, type PoiClickEvent } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef } from "react";

// Mymensingh city center
const DEFAULT_LAT = 24.7471;
const DEFAULT_LNG = 90.4203;

type GeocodeInfo = {
  placeName: string;
  additionalInfo: string;
};

async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeInfo> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const r = results[0];
    if (!r) throw new Error("no result");

    const placeName = r.name ?? r.street ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    const parts: string[] = [];
    if (r.streetNumber) parts.push(r.streetNumber);
    if (r.street && r.street !== r.name) parts.push(r.street);
    if (r.district) parts.push(r.district);
    if (r.city) parts.push(r.city);
    if (r.region && r.region !== r.city) parts.push(r.region);
    const additionalInfo = parts.join(", ") || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    return { placeName, additionalInfo };
  } catch {
    return {
      placeName: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      additionalInfo: "",
    };
  }
}

export default function LocationPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

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
  const [geocodeInfo, setGeocodeInfo] = useState<GeocodeInfo | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [label, setLabel] = useState("");
  const [locating, setLocating] = useState(false);
  const { isKeyboardVisible, keyboardHeight } = useKeyboard();
  const [saving, setSaving] = useState(false);

  const updatePin = async (latitude: number, longitude: number, forcedName?: string) => {
    setMarkerCoord({ latitude, longitude });
    setGeocoding(true);
    const info = await reverseGeocode(latitude, longitude);
    
    // If a forced name (like a POI name) is provided, use it instead of reverse geocoding result
    const placeName = forcedName || info.placeName;
    
    setGeocodeInfo({ ...info, placeName });
    // Pre-fill label with place name only if user hasn't typed anything yet
    setLabel((prev) => (prev.trim() ? prev : placeName));
    setGeocoding(false);
  };

  const handleMarkerDrag = (e: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updatePin(latitude, longitude);
  };

  const handleCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        CustomAlert.alert(
          "Permission Denied",
          "Enable location permission in Settings to use this feature."
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = pos.coords;
      const newRegion = { ...region, latitude, longitude };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      await updatePin(latitude, longitude);
    } catch {
      CustomAlert.alert("Error", "Could not get your current location.");
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!label.trim()) {
      CustomAlert.alert("Label required", 'Enter a name like "Home" or "Work".');
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

      const address =
        geocodeInfo?.additionalInfo ||
        `${markerCoord.latitude.toFixed(5)}, ${markerCoord.longitude.toFixed(5)}`;

      const newLocation: SavedLocation = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        label: label.trim(),
        address,
        lat: markerCoord.latitude,
        lng: markerCoord.longitude,
      };

      const updated: LocationData = {
        locations: [...existing.locations, newLocation],
        activeId: existing.activeId ?? newLocation.id,
      };

      await updateMe({ locationData: updated });
      if (router.canGoBack()) router.back(); else router.replace("/(tabs)/profile");
    } catch (e) {
      CustomAlert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to save location."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(251,249,245,0.97)",
            shadowColor: Colors.primary,
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 4,
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            <Text style={{ color: Colors.primary, fontSize: 15, fontWeight: "600" }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.onSurface }}>
            Pick Location
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Map */}
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            region={region}
            onRegionChangeComplete={(r) => setRegion(r)}
            showsUserLocation
            showsMyLocationButton={false}
            onPress={(e) => updatePin(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
            onPoiClick={(e) => updatePin(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude, e.nativeEvent.name)}
          >
            <Marker
              coordinate={markerCoord}
              draggable
              onDragEnd={handleMarkerDrag}
              pinColor={Colors.primary}
            />
          </MapView>

          {/* My Location button — floating over map */}
          <TouchableOpacity
            onPress={handleCurrentLocation}
            disabled={locating}
            activeOpacity={0.85}
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: Colors.surface,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 8,
              zIndex: 20,
            }}
          >
            {locating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="locate" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom panel */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 18,
            backgroundColor: Colors.surface,
            shadowColor: Colors.primary,
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 8,
            paddingBottom: isKeyboardVisible ? keyboardHeight : insets.bottom + 20,
          }}
        >
          {/* Instruction */}
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 2,
              color: Colors.secondary,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Drag the pin to your delivery spot
          </Text>

          {/* Geocode result */}
          {(geocoding || geocodeInfo) && (
            <View
              style={{
                backgroundColor: Colors.surfaceContainerHigh,
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              {geocoding ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="location" size={20} color={Colors.primary} style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: Colors.onSurface,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {geocodeInfo?.placeName}
                    </Text>
                    {!!geocodeInfo?.additionalInfo && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: Colors.onSurfaceVariant,
                          lineHeight: 17,
                        }}
                        numberOfLines={2}
                      >
                        {geocodeInfo.additionalInfo}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Label */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                letterSpacing: 1.5,
                color: Colors.onSurfaceVariant,
                textTransform: "uppercase",
                marginBottom: 6,
                marginLeft: 4,
              }}
            >
              Location Label
            </Text>
            <TextInput
              style={{
                height: 48,
                backgroundColor: Colors.surfaceContainerHigh,
                borderRadius: 12,
                paddingHorizontal: 16,
                fontSize: 16,
                color: Colors.onSurface,
              }}
              placeholder="e.g. Home, Work, Mama's House"
              placeholderTextColor={Colors.outline}
              value={label}
              onChangeText={setLabel}
              returnKeyType="done"
            />
          </View>

          {/* Save button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || geocoding}
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
                opacity: saving || geocoding ? 0.7 : 1,
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
        </ScrollView>
    </View>
  );
}
