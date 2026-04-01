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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import {
  getMe,
  updateMe,
  type LocationData,
  type SavedLocation,
} from "@/lib/api";

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
      className="bg-surface-container-lowest rounded-xl p-4 mb-3"
      style={{
        borderWidth: isActive ? 2 : 1,
        borderColor: isActive
          ? Colors.primary
          : `${Colors.outlineVariant}40`,
        shadowColor: Colors.primary,
        shadowOpacity: isActive ? 0.1 : 0.04,
        shadowRadius: 12,
        elevation: isActive ? 3 : 1,
      }}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: isActive ? Colors.primary : Colors.outlineVariant,
            }}
          />
          <Text className="font-headline text-on-surface text-base">
            {loc.label}
          </Text>
          {isActive && (
            <View
              className="px-2 rounded-full"
              style={{
                paddingVertical: 2,
                backgroundColor: `${Colors.primary}15`,
              }}
            >
              <Text
                style={{ fontSize: 10, color: Colors.primary, fontWeight: "700" }}
              >
                Active
              </Text>
            </View>
          )}
        </View>
        {isSaving ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}
          >
            <Text style={{ color: Colors.error, fontSize: 20, lineHeight: 22 }}>
              ×
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text
        className="text-sm text-on-surface-variant"
        style={{ marginLeft: 18 }}
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
          <Text className="text-sm font-body-semibold text-primary">
            Set as active
          </Text>
        </TouchableOpacity>
      )}
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
      .catch(() => Alert.alert("Error", "Could not load saved locations"))
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
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to update."
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Location", "Remove this saved location?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updatedLocations = locationData.locations.filter(
            (l) => l.id !== id
          );
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
            Alert.alert(
              "Error",
              e instanceof Error ? e.message : "Failed to delete."
            );
          } finally {
            setSavingId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-surface justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View
        className="px-5 pb-4 flex-row items-center"
        style={{
          paddingTop: insets.top + 8,
          backgroundColor: "rgba(251,249,245,0.97)",
          shadowColor: Colors.primary,
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="mr-4"
        >
          <Text className="text-primary font-body-semibold text-base">←</Text>
        </TouchableOpacity>
        <Text className="text-lg font-headline text-on-surface">
          Saved Locations
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Add new location button */}
        <TouchableOpacity
          onPress={() => router.push("/profile/location-picker")}
          activeOpacity={0.85}
          className="mb-6"
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
              flexDirection: "row",
              gap: 8,
              shadowColor: Colors.primary,
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text
              style={{
                color: Colors.onPrimary,
                fontWeight: "700",
                fontSize: 15,
              }}
            >
              + Add New Location
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Location list */}
        {locationData.locations.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Text className="text-4xl">📍</Text>
            <Text className="text-on-surface font-headline text-lg">
              No saved locations
            </Text>
            <Text className="text-on-surface-variant text-sm text-center leading-relaxed px-4">
              Add a delivery location to use when placing orders.
            </Text>
          </View>
        ) : (
          <>
            <Text
              className="text-[11px] font-label uppercase text-on-surface-variant mb-3"
              style={{ letterSpacing: 1.5 }}
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
