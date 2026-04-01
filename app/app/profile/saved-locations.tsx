import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import {
  getMe,
  updateMe,
  type LocationData,
  type SavedLocation,
} from "@/lib/api";
import { CustomAlert } from "@/store/alert-store";

function parseLocationData(raw: unknown): LocationData {
  if (raw && typeof raw === "object" && "locations" in raw) {
    return raw as LocationData;
  }
  return { locations: [], activeId: null };
}

function LocationItem({
  loc,
  isActive,
  onSetActive,
  onDelete,
  isSaving,
}: {
  loc: SavedLocation;
  isActive: boolean;
  onSetActive: () => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  return (
    <View
      style={{
        borderRadius: 16,
        marginBottom: 14,
        overflow: "hidden",
        borderWidth: isActive ? 2 : 1,
        borderColor: isActive ? Colors.primary : `${Colors.outlineVariant}50`,
        shadowColor: Colors.primary,
        shadowOpacity: isActive ? 0.1 : 0.04,
        shadowRadius: 12,
        elevation: isActive ? 3 : 1,
        backgroundColor: Colors.surfaceContainerLowest,
      }}
    >
      {/* Mini map */}
      <View style={{ height: 110, pointerEvents: "none" }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: loc.lat,
            longitude: loc.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          liteMode
        >
          <Marker
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            pinColor={Colors.primary}
          />
        </MapView>
      </View>

      {/* Info row */}
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isActive ? Colors.primary : Colors.outlineVariant,
              }}
            />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: Colors.onSurface,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {loc.label}
            </Text>
            {isActive && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 20,
                  backgroundColor: `${Colors.primary}15`,
                }}
              >
                <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: "700" }}>
                  Active
                </Text>
              </View>
            )}
          </View>

          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
          ) : (
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}
              style={{ marginLeft: 8 }}
            >
              <Text style={{ color: Colors.error, fontSize: 20, lineHeight: 22 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={{
            fontSize: 12,
            color: Colors.onSurfaceVariant,
            marginLeft: 18,
            lineHeight: 17,
          }}
          numberOfLines={2}
        >
          {loc.address}
        </Text>

        {!isActive && (
          <TouchableOpacity
            onPress={onSetActive}
            disabled={isSaving}
            style={{ marginTop: 10, marginLeft: 18, alignSelf: "flex-start" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.primary }}>
              Set as active
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function SavedLocationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [locationData, setLocationData] = useState<LocationData>({
    locations: [],
    activeId: null,
  });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    getMe()
      .then((profile) => {
        setLocationData(parseLocationData(profile.locationData));
      })
      .catch(() => CustomAlert.alert("Error", "Could not load saved locations"))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const handleSetActive = async (id: string) => {
    const updated: LocationData = { ...locationData, activeId: id };
    setSavingId(id);
    try {
      await updateMe({ locationData: updated });
      setLocationData(updated);
    } catch (e) {
      CustomAlert.alert("Error", e instanceof Error ? e.message : "Failed to update.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (id: string) => {
    CustomAlert.alert("Delete Location", "Remove this saved location?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedLocations = locationData.locations.filter((l) => l.id !== id);
          const updatedActiveId =
            locationData.activeId === id
              ? (updatedLocations[0]?.id ?? null)
              : locationData.activeId;
          const updated: LocationData = {
            locations: updatedLocations,
            activeId: updatedActiveId,
          };
          setSavingId(id);
          try {
            await updateMe({ locationData: updated });
            setLocationData(updated);
          } catch (e) {
            CustomAlert.alert("Error", e instanceof Error ? e.message : "Failed to delete.");
          } finally {
            setSavingId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(251,249,245,0.97)",
          shadowColor: Colors.primary,
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginRight: 14 }}
        >
          <Text style={{ color: Colors.primary, fontWeight: "600", fontSize: 16 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.onSurface }}>
          Saved Locations
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add new location button */}
        <TouchableOpacity
          onPress={() => router.push("/profile/location-picker")}
          activeOpacity={0.85}
          style={{ marginBottom: 24 }}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: 52,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: Colors.primary,
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text style={{ color: Colors.onPrimary, fontWeight: "700", fontSize: 15 }}>
              + Add New Location
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Location list */}
        {locationData.locations.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 64, gap: 12 }}>
            <Text style={{ fontSize: 40 }}>📍</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.onSurface }}>
              No saved locations
            </Text>
            <Text
              style={{
                color: Colors.onSurfaceVariant,
                fontSize: 14,
                textAlign: "center",
                lineHeight: 21,
                paddingHorizontal: 16,
              }}
            >
              Add a delivery location to use when placing orders.
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: Colors.onSurfaceVariant,
                marginBottom: 12,
              }}
            >
              Your Locations
            </Text>
            {locationData.locations.map((loc) => (
              <LocationItem
                key={loc.id}
                loc={loc}
                isActive={loc.id === locationData.activeId}
                onSetActive={() => handleSetActive(loc.id)}
                onDelete={() => handleDelete(loc.id)}
                isSaving={savingId === loc.id}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
