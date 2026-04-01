import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { orders, users, menus } from "@/db/schema";
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

    case "accept_change": {
      if (order.status !== "PendingAdminAction") {
        return NextResponse.json({ error: "Order not in PendingAdminAction" }, { status: 400 });
      }
      const cr = order.changeRequest as { requestedQuantity?: number; previousStatus?: string } | null;
      if (!cr?.requestedQuantity) {
        return NextResponse.json({ error: "No pending change request found" }, { status: 400 });
      }
      const [menu] = await db.select({ price: menus.price }).from(menus).where(eq(menus.id, order.menuId)).limit(1);
      const newQty = cr.requestedQuantity;
      const newTotalPrice = menu ? menu.price * newQty : order.totalPrice;
      const [updated] = await db
        .update(orders)
        .set({
          quantity: newQty,
          totalPrice: newTotalPrice,
          changeRequest: null,
          status: (cr.previousStatus ?? "Confirmed") as "PendingPayment" | "Confirmed" | "Cooking" | "OutForDelivery" | "Delivered" | "Cancelled" | "PendingAdminAction",
          adminNote: adminNote ?? null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();
      return NextResponse.json({ data: updated });
    }

    case "reject_change": {
      if (order.status !== "PendingAdminAction") {
        return NextResponse.json({ error: "Order not in PendingAdminAction" }, { status: 400 });
      }
      const cr2 = order.changeRequest as { previousStatus?: string } | null;
      const [updated] = await db
        .update(orders)
        .set({
          changeRequest: null,
          status: (cr2?.previousStatus ?? "Confirmed") as "PendingPayment" | "Confirmed" | "Cooking" | "OutForDelivery" | "Delivered" | "Cancelled" | "PendingAdminAction",
          adminNote: adminNote ?? null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();
      return NextResponse.json({ data: updated });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
