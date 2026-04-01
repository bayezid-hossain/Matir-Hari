import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import {
  getMenusByDate,
  getNotifications,
  getMe,
  type TodayMenus,
  type MenuEntry,
} from "@/lib/api";

function getBdtTodayString(): string {
  return new Date(Date.now() + 6 * 3_600_000).toISOString().slice(0, 10);
}

function useCountdown(cutoffHour: number) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // BDT = UTC+6; build a cutoff Date in UTC corresponding to cutoffHour BDT
      const cutoff = new Date();
      cutoff.setUTCHours(cutoffHour - 6, 0, 0, 0);
      if (cutoff.getTime() <= now.getTime()) {
        setRemaining("Closed");
        return;
      }
      const diff = cutoff.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [cutoffHour]);

  return remaining;
}

function MenuCard({
  item,
  onOrder,
}: {
  item: MenuEntry;
  onOrder: (item: MenuEntry) => void;
}) {
  return (
    <View
      className="bg-surface-container-lowest rounded-2xl overflow-hidden mb-6"
      style={{
        shadowColor: Colors.primary,
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 3,
      }}
    >
      <View className="relative">
        <Image
          source={{
            uri:
              item.imageUrl ??
              "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600",
          }}
          style={{ width: "100%", aspectRatio: 16 / 10 }}
          resizeMode="cover"
        />
        <View className="absolute top-4 left-4">
          <LinearGradient
            colors={
              item.type === "Lunch"
                ? [Colors.primary, Colors.primaryContainer]
                : [Colors.secondary, Colors.secondaryContainer]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99 }}
          >
            <Text
              className="text-white font-label text-[10px] uppercase"
              style={{ letterSpacing: 2 }}
            >
              {item.type === "Lunch" ? "Lunch · 12–3 PM" : "Dinner · 7–10 PM"}
            </Text>
          </LinearGradient>
        </View>
        {item.cutoffPassed && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <Text className="text-white font-headline text-lg font-bold">
              Orders Closed
            </Text>
          </View>
        )}
      </View>

      <View className="p-6 gap-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 mr-3">
            <Text className="text-2xl font-headline text-on-surface mb-2">
              {item.name}
            </Text>
            <Text className="text-sm text-on-surface-variant leading-relaxed">
              {item.description}
            </Text>
          </View>
          <Text className="text-2xl font-headline-extra text-primary">
            ৳{item.price}
          </Text>
        </View>
        <View
          className="flex-row items-center justify-between pt-4"
          style={{
            borderTopWidth: 1,
            borderTopColor: `${Colors.outlineVariant}28`,
          }}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-primary">⏰</Text>
            <Text className="text-sm font-body-medium text-on-surface-variant">
              Cut-off: {item.cutoffTime}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onOrder(item)}
            disabled={item.cutoffPassed}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                item.cutoffPassed
                  ? [Colors.surfaceContainerHighest, Colors.surfaceContainerHighest]
                  : [Colors.primary, Colors.primaryContainer]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 }}
            >
              <Text
                style={{
                  color: item.cutoffPassed ? Colors.outline : Colors.onPrimary,
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {item.cutoffPassed ? "Closed" : "Order Now"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menus, setMenus] = useState<TodayMenus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getBdtTodayString());
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeLocationLabel, setActiveLocationLabel] = useState("Mymensingh");
  const lunchCountdown = useCountdown(10);
  const dinnerCountdown = useCountdown(17);

  // Generate the 3 date chips (today, tomorrow, day after)
  const dateChips = useMemo(() => {
    const today = getBdtTodayString();
    const [y, m, d] = today.split("-").map(Number);
    return [0, 1, 2].map((offset) => {
      const dt = new Date(Date.UTC(y, m - 1, d + offset));
      const iso = dt.toISOString().slice(0, 10);
      const label =
        offset === 0
          ? "Today"
          : offset === 1
          ? "Tomorrow"
          : dt.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            });
      return { iso, label };
    });
  }, []);

  const loadMenus = useCallback(async () => {
    try {
      const data = await getMenusByDate(selectedDate);
      setMenus(data);
    } catch {
      /* offline fallback */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    loadMenus();
  }, [loadMenus]);

  // Load unread notification count on mount
  useEffect(() => {
    getNotifications()
      .then((notifs) =>
        setUnreadCount(notifs.filter((n) => !n.read).length)
      )
      .catch(() => {});
  }, []);

  // Load active location label on mount
  useEffect(() => {
    getMe()
      .then((profile) => {
        const loc = profile.locationData;
        if (loc && loc.activeId) {
          const active = loc.locations.find((l) => l.id === loc.activeId);
          if (active) setActiveLocationLabel(active.label);
        }
      })
      .catch(() => {});
  }, []);

  const isToday = selectedDate === dateChips[0].iso;

  const activeCutoff = isToday
    ? menus?.lunch && !menus.lunch.cutoffPassed
      ? `Lunch cutoff in ${lunchCountdown}`
      : menus?.dinner && !menus.dinner.cutoffPassed
      ? `Dinner cutoff in ${dinnerCountdown}`
      : null
    : null;

  const menuHeading =
    selectedDate === dateChips[0].iso
      ? "Today's Curated Sets"
      : selectedDate === dateChips[1].iso
      ? "Tomorrow's Menu"
      : `${dateChips[2].label}'s Menu`;

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          backgroundColor: "rgba(251,249,245,0.92)",
          shadowColor: Colors.primary,
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 4,
        }}
        className="px-5 pb-4"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-1">
            <Text>📍</Text>
            <Text className="text-secondary font-body-semibold text-sm">
              {activeLocationLabel}
            </Text>
          </View>
          <Text
            className="text-xl font-headline-extra text-primary"
            style={{ letterSpacing: -0.5 }}
          >
            Matir Hari
          </Text>
          {/* Notification bell with unread badge */}
          <TouchableOpacity
            onPress={() => router.push("/profile/notifications")}
            style={{ position: "relative" }}
          >
            <Text className="text-primary text-xl">🔔</Text>
            {unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: Colors.error,
                  borderWidth: 1.5,
                  borderColor: Colors.surface,
                }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadMenus();
            }}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View className="bg-surface-container-low rounded-2xl p-6 mb-6">
          {activeCutoff && (
            <View className="bg-secondary-fixed self-start flex-row items-center gap-2 px-3 py-1 rounded-full mb-4">
              <Text
                className="text-on-secondary-fixed text-[10px] font-label uppercase"
                style={{ letterSpacing: 1.5 }}
              >
                ⏱ {activeCutoff}
              </Text>
            </View>
          )}
          <Text
            className="text-3xl font-headline-extra text-on-surface leading-tight mb-2"
            style={{ letterSpacing: -0.5 }}
          >
            Authentic Flavors,{"\n"}
            <Text className="text-primary">Earthen Traditions.</Text>
          </Text>
          <Text className="text-on-surface-variant text-sm leading-relaxed">
            Daily meals slow-cooked in traditional clay pots.
          </Text>
        </View>

        {/* Date chip selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          style={{ marginBottom: 20 }}
        >
          {dateChips.map((chip) => {
            const isSelected = chip.iso === selectedDate;
            return (
              <TouchableOpacity
                key={chip.iso}
                onPress={() => setSelectedDate(chip.iso)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  borderRadius: 99,
                  backgroundColor: isSelected
                    ? Colors.primary
                    : Colors.surfaceContainerHigh,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? Colors.onPrimary : Colors.onSurfaceVariant,
                    fontWeight: isSelected ? "700" : "500",
                    fontSize: 13,
                  }}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Menu heading */}
        <View
          className="flex-row items-baseline justify-between pb-4 mb-5"
          style={{
            borderBottomWidth: 1,
            borderBottomColor: `${Colors.outlineVariant}28`,
          }}
        >
          <Text className="text-2xl font-headline text-on-surface">
            {menuHeading}
          </Text>
          <Text
            className="text-secondary font-label text-[10px] uppercase"
            style={{ letterSpacing: 1.5 }}
          >
            {isToday ? "Handcrafted Daily" : "Pre-Order"}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            color={Colors.primary}
            size="large"
            style={{ marginTop: 32 }}
          />
        ) : (
          <>
            {menus?.lunch && (
              <MenuCard
                item={menus.lunch}
                onOrder={(item) =>
                  router.push({
                    pathname: "/checkout",
                    params: { menuId: item.id, deliveryDate: selectedDate },
                  })
                }
              />
            )}
            {menus?.dinner && (
              <MenuCard
                item={menus.dinner}
                onOrder={(item) =>
                  router.push({
                    pathname: "/checkout",
                    params: { menuId: item.id, deliveryDate: selectedDate },
                  })
                }
              />
            )}
            {!menus?.lunch && !menus?.dinner && (
              <View className="items-center py-16">
                <Text className="text-5xl mb-4">🍲</Text>
                <Text className="text-on-surface-variant text-base">
                  No meals available{isToday ? " today" : " on this day"}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Benefits row */}
        <View className="flex-row gap-3 mt-4">
          {[
            { icon: "🌿", title: "100% Organic", sub: "Local Mymensingh farms" },
            { icon: "🏺", title: "Clay Pot", sub: "Nutrients preserved" },
            { icon: "🛵", title: "Zero Waste", sub: "Sustainable packing" },
          ].map((b) => (
            <View
              key={b.title}
              className="flex-1 bg-surface-container-high rounded-2xl p-4 items-center gap-1"
            >
              <Text className="text-2xl">{b.icon}</Text>
              <Text className="text-on-surface font-body-semibold text-[11px] text-center">
                {b.title}
              </Text>
              <Text className="text-on-surface-variant text-[10px] text-center leading-tight">
                {b.sub}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
