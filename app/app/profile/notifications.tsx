import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { getNotifications, markNotificationsRead, Notification } from "@/lib/api";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      if (data.some(n => !n.read)) {
        await markNotificationsRead().catch(() => {});
      }
    } catch (e) {
      Alert.alert("Error", "Could not load notifications");
    } finally {
      setLoading(false);
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
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 8, backgroundColor: "rgba(251,249,245,0.95)", shadowColor: Colors.primary, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 }}
        className="px-5 pb-4 flex-row items-center justify-between"
      >
        <Text className="text-xl font-headline-extra text-primary" style={{ letterSpacing: -0.5 }}>Notifications</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="items-center justify-center py-20 opacity-50">
            <Text className="text-4xl mb-4">🔕</Text>
            <Text className="text-lg font-headline text-on-surface-variant">No notifications yet</Text>
          </View>
        ) : (
          <View className="gap-4">
            {notifications.map((notif) => (
              <View
                key={notif.id}
                className={`bg-surface-container-lowest rounded-2xl p-5 border ${notif.read ? 'border-transparent' : 'border-primary/20'}`}
                style={{
                  shadowColor: Colors.primary,
                  shadowOpacity: notif.read ? 0.02 : 0.08,
                  shadowRadius: 16,
                  elevation: 2,
                }}
              >
                {!notif.read && (
                  <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                )}
                <Text className="text-[10px] font-label uppercase text-secondary mb-2" style={{ letterSpacing: 1.5 }}>
                  {new Date(notif.createdAt).toLocaleDateString()}
                </Text>
                <Text className="text-lg font-headline text-on-surface mb-1">
                  {notif.title}
                </Text>
                <Text className="text-sm font-body-medium text-on-surface-variant leading-relaxed">
                  {notif.message}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
