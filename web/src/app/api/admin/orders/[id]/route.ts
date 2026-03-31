import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { action, adminNote, cancelReason } = body as {
    action: string;
    adminNote?: string;
    cancelReason?: string;
  };

  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  switch (action) {
    case "confirm_payment": {
      if (order.status !== "PendingPayment" && order.status !== "PendingAdminAction") {
        return NextResponse.json({ error: "Order not awaiting payment" }, { status: 400 });
      }
      const [updated] = await db
        .update(orders)
        .set({ status: "Confirmed", confirmedAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return NextResponse.json({ data: updated });
    }

    case "start_cooking": {
      if (order.status !== "Confirmed") {
        return NextResponse.json({ error: "Order must be Confirmed first" }, { status: 400 });
      }
      const [updated] = await db
        .update(orders)
        .set({ status: "Cooking", cookingStartedAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return NextResponse.json({ data: updated });
    }

    case "out_for_delivery": {
      if (order.status !== "Cooking") {
        return NextResponse.json({ error: "Order must be Cooking first" }, { status: 400 });
      }
      const [updated] = await db
        .update(orders)
        .set({ status: "OutForDelivery", outForDeliveryAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return NextResponse.json({ data: updated });
    }

    case "deliver": {
      if (order.status !== "OutForDelivery") {
        return NextResponse.json({ error: "Order must be OutForDelivery first" }, { status: 400 });
      }
      const [updated] = await db
        .update(orders)
        .set({ status: "Delivered", deliveredAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      // Increment trust score
      await db
        .update(users)
        .set({
          trustScore: sql`${users.trustScore} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, order.userId));
      return NextResponse.json({ data: updated });
    }

    case "admin_cancel": {
      const [updated] = await db
        .update(orders)
        .set({
          status: "Cancelled",
          cancelReason: cancelReason ?? "Cancelled by admin",
          adminNote: adminNote ?? null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();
      return NextResponse.json({ data: updated });
    }

    case "add_note": {
      const [updated] = await db
        .update(orders)
        .set({ adminNote: adminNote ?? null, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return NextResponse.json({ data: updated });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
