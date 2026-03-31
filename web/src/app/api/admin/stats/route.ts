import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, count, and, gte } from "drizzle-orm";

function todayBDTRange(): { start: Date; end: Date } {
  const now = new Date();
  const bdtOffset = 6 * 60 * 60 * 1000;
  const bdtNow = new Date(now.getTime() + bdtOffset);
  const startBDT = new Date(
    Date.UTC(bdtNow.getUTCFullYear(), bdtNow.getUTCMonth(), bdtNow.getUTCDate())
  );
  const endBDT = new Date(startBDT.getTime() + 24 * 60 * 60 * 1000);
  // Convert back to UTC
  return {
    start: new Date(startBDT.getTime() - bdtOffset),
    end: new Date(endBDT.getTime() - bdtOffset),
  };
}

export async function GET(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start, end } = todayBDTRange();

  const [
    todayOrders,
    pendingPayments,
    pendingAdminActions,
    confirmedToday,
    deliveredToday,
    totalUsers,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(orders)
      .where(and(gte(orders.orderedAt, start), gte(end, orders.orderedAt))),
    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "PendingPayment")),
    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, "PendingAdminAction")),
    db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.status, "Confirmed"),
          gte(orders.orderedAt, start)
        )
      ),
    db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.status, "Delivered"),
          gte(orders.deliveredAt!, start)
        )
      ),
    db.select({ count: count() }).from(users),
  ]);

  return NextResponse.json({
    todayOrders: todayOrders[0]?.count ?? 0,
    pendingPayments: pendingPayments[0]?.count ?? 0,
    pendingAdminActions: pendingAdminActions[0]?.count ?? 0,
    confirmedToday: confirmedToday[0]?.count ?? 0,
    deliveredToday: deliveredToday[0]?.count ?? 0,
    totalUsers: totalUsers[0]?.count ?? 0,
  });
}
