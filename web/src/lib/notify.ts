import { db } from "@/db";
import { notifications, adminNotifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
 
/**
 * Send an Expo Push Notification via the Expo Push API.
 */
async function sendExpoPush(token: string, title: string, message: string, data?: any) {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title,
        body: message,
        data,
        channelId: "default",
        priority: "high",
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[expo-push] Failed to send: ${response.status} - ${errorText}`);
    }
  } catch (e) {
    console.error("[expo-push] Error sending notification:", e);
  }
}
 
/**
 * Insert an in-app notification for a user and send a real push notification if a token exists.
 * Fire-and-forget — errors are swallowed so they never break the main response.
 */
export async function notify(
  userId: string,
  type: string,
  title: string,
  message: string,
  orderId?: string
): Promise<void> {
  try {
    // 1. Store in DB
    await db.insert(notifications).values({ userId, type, title, message, orderId: orderId ?? null });
 
    // 2. Fetch push token and send push
    const [user] = await db
      .select({ expoPushToken: users.expoPushToken })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
 
    if (user?.expoPushToken) {
      await sendExpoPush(user.expoPushToken, title, message, { orderId, type });
    }
  } catch (e) {
    console.error("[notify] Failed to create notification:", e);
  }
}
 
/**
 * Insert a notification for the admin.
 */
export async function notifyAdmin(
  type: string,
  title: string,
  message: string,
  orderId?: string,
  userId?: string
): Promise<void> {
  try {
    await db.insert(adminNotifications).values({
      type,
      title,
      message,
      orderId: orderId ?? null,
      userId: userId ?? null,
    });
  } catch (e) {
    console.error("[notifyAdmin] Failed to create admin notification:", e);
  }
}
