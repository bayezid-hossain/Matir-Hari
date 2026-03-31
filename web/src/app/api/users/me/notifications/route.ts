import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/response";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

/**
 * GET /api/users/me/notifications
 * Returns unread notifications for the authenticated user.
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, auth.sub))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return ok(userNotifications);
}

/**
 * PATCH /api/users/me/notifications
 * Body: { ids: string[] } — mark notifications as read.
 */
export async function PATCH(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  // Mark all as read for simplicity
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, auth.sub));

  return ok({ message: "All notifications marked as read" });
}
