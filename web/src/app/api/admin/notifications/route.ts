import { db } from "@/db";
import { adminNotifications, users } from "@/db/schema";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
 
/**
 * GET /api/admin/notifications
 * Returns latest 50 notifications for admin.
 */
export async function GET(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
 
  const rows = await db
    .select({
      id: adminNotifications.id,
      type: adminNotifications.type,
      title: adminNotifications.title,
      message: adminNotifications.message,
      orderId: adminNotifications.orderId,
      read: adminNotifications.read,
      createdAt: adminNotifications.createdAt,
      user: {
        id: users.id,
        name: users.name,
        phone: users.phone,
      },
    })
    .from(adminNotifications)
    .leftJoin(users, eq(adminNotifications.userId, users.id))
    .orderBy(desc(adminNotifications.createdAt))
    .limit(50);
 
  return NextResponse.json({ data: rows });
}
 
/**
 * PATCH /api/admin/notifications
 * Mark all as read.
 */
export async function PATCH(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
 
  await db
    .update(adminNotifications)
    .set({ read: true });
 
  return NextResponse.json({ message: "All notifications marked as read" });
}
