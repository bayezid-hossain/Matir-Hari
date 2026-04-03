import { NextRequest } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, menus, users, paymentNumbers } from "@/db/schema";
import { v2 as cloudinary } from "cloudinary";
import { getAuthUser } from "@/lib/auth";
import { ok, err, unauthorized, notFound, forbidden } from "@/lib/response";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isCutoffPassed(mealType: "Lunch" | "Dinner"): boolean {
  const now = new Date();
  const bdtOffset = 6 * 60;
  const localMins =
    ((now.getUTCHours() * 60 + now.getUTCMinutes() + bdtOffset) % (24 * 60));
  const cutoffMins = mealType === "Lunch" ? 10 * 60 : 17 * 60;
  return localMins >= cutoffMins;
}

function isWithinGracePeriod(orderedAt: Date): boolean {
  const thirtyMins = 30 * 60 * 1000;
  return Date.now() - orderedAt.getTime() <= thirtyMins;
}

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const { id } = await params;

  const [row] = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      commitmentFee: orders.commitmentFee,
      deliveryFee: orders.deliveryFee,
      trxId: orders.trxId,
      paymentMethod: orders.paymentMethod,
      cutOffReached: orders.cutOffReached,
      cancelReason: orders.cancelReason,
      adminNote: orders.adminNote,
      deliveryAddress: orders.deliveryAddress,
      menuSnapshot: orders.menuSnapshot,
      orderedAt: orders.orderedAt,
      paymentSubmittedAt: orders.paymentSubmittedAt,
      confirmedAt: orders.confirmedAt,
      cookingStartedAt: orders.cookingStartedAt,
      outForDeliveryAt: orders.outForDeliveryAt,
      deliveredAt: orders.deliveredAt,
      updatedAt: orders.updatedAt,
      paymentScreenshot: orders.paymentScreenshot,
      quantity: orders.quantity,
      changeRequest: orders.changeRequest,
      menu: {
        id: menus.id,
        name: menus.name,
        type: menus.type,
        description: menus.description,
        itemsDescription: menus.itemsDescription,
        imageUrl: menus.imageUrl,
        price: menus.price,
      },
    })
    .from(orders)
    .innerJoin(menus, eq(orders.menuId, menus.id))
    .where(and(eq(orders.id, id), eq(orders.userId, auth.sub)))
    .limit(1);

  if (!row) return notFound("Order not found");

  const { menuSnapshot, menu, ...rest } = row;
  const order = { ...rest, menu: (menuSnapshot as typeof menu | null) ?? menu };

  return ok(order);
}

// ─── PATCH /api/orders/:id ────────────────────────────────────────────────────

/**
 * Handles several sub-actions via `action` field in the body:
 *
 * "submit_payment"  — user submits trxId after ordering
 * "cancel"          — user cancels (before or after cut-off)
 * "request_change"  — post-cutoff edit request (sets status PendingAdminAction)
 *
 * Admin-only actions (checked by a simple `isAdmin` flag — extend as needed):
 * "confirm_payment" — admin verifies TrxID → Confirmed
 * "start_cooking"   — Cooking
 * "out_for_delivery"— OutForDelivery
 * "deliver"         — Delivered (increments trust_score)
 * "admin_cancel"    — admin cancels order
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { action, trxId, paymentMethod, paymentScreenshot, cancelReason, requestedQuantity, paymentNumberId, isAdmin } =
    body as {
      action?: string;
      trxId?: string;
      paymentMethod?: string;
      paymentScreenshot?: string;
      cancelReason?: string;
      requestedQuantity?: number;
      paymentNumberId?: string;
      isAdmin?: boolean;
    };

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.userId, auth.sub)))
    .limit(1);

  if (!order) return notFound("Order not found");

  const [menu] = await db
    .select()
    .from(menus)
    .where(eq(menus.id, order.menuId))
    .limit(1);

  switch (action) {
    // ── Customer: submit payment ─────────────────────────────────────────────
    case "submit_payment": {
      if (order.status !== "PendingPayment")
        return err("Order is not awaiting payment");
      if (!paymentMethod || !["bKash", "Nagad"].includes(paymentMethod))
        return err("paymentMethod must be bKash or Nagad");

      const cutOffReached = menu
        ? isCutoffPassed(menu.type as "Lunch" | "Dinner")
        : false;

      // Extract old screenshot to delete if replaced
      const [existing] = await db
        .select({ paymentScreenshot: orders.paymentScreenshot })
        .from(orders)
        .where(eq(orders.id, id));

      if (existing?.paymentScreenshot && paymentScreenshot && existing.paymentScreenshot !== paymentScreenshot) {
        // Delete old one from Cloudinary
        try {
          const publicId = existing.paymentScreenshot.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`matir-hari/payments/${publicId}`);
          }
        } catch (err) {
          console.error("Cloudinary Delete Error:", err);
        }
      }

      // Fetch payment number snapshot if provided
      let paymentNumberSnapshot: Record<string, unknown> | null = null;
      if (paymentNumberId) {
        const [pn] = await db
          .select()
          .from(paymentNumbers)
          .where(eq(paymentNumbers.id, paymentNumberId))
          .limit(1);
        if (pn) {
          paymentNumberSnapshot = { id: pn.id, type: pn.type, number: pn.number, label: pn.label };
        }
      }

      const [updated] = await db
        .update(orders)
        .set({
          trxId: trxId?.trim() || null,
          paymentMethod: (paymentMethod as "bKash" | "Nagad") || "bKash",
          paymentScreenshot: paymentScreenshot?.trim() || null,
          paymentNumberSnapshot,
          paymentSubmittedAt: new Date(),
          cutOffReached,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return ok(updated);
    }

    // ── Customer: cancel order ────────────────────────────────────────────────
    case "cancel": {
      if (order.status === "Cancelled") return err("Order already cancelled");
      if (order.status === "Delivered") return err("Delivered orders cannot be cancelled");

      const cutOffReached = menu
        ? isCutoffPassed(menu.type as "Lunch" | "Dinner")
        : false;

      // After cut-off → requires admin approval
      if (cutOffReached && !isAdmin) {
        const [updated] = await db
          .update(orders)
          .set({
            status: "PendingAdminAction",
            cancelReason: cancelReason ?? "",
            cutOffReached: true,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, id))
          .returning();
        return ok({
          ...updated,
          message: "Cancellation request submitted for admin review",
        });
      }

      const [updated] = await db
        .update(orders)
        .set({
          status: "Cancelled",
          cancelReason: cancelReason ?? "",
          cutOffReached,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return ok(updated);
    }

    // ── Customer: request change (quantity or other) ──────────────────────
    case "request_change": {
      if (["Delivered", "Cancelled"].includes(order.status))
        return err("Cannot request changes on a delivered or cancelled order");

      const reqQty = requestedQuantity
        ? Math.max(1, Number(requestedQuantity))
        : (order as any).quantity ?? 1;

      const [updated] = await db
        .update(orders)
        .set({
          status: "PendingAdminAction",
          changeRequest: {
            requestedQuantity: reqQty,
            reason: cancelReason ?? "Customer requested change",
            requestedAt: new Date().toISOString(),
            previousStatus: order.status,
          },
          cutOffReached: menu ? isCutoffPassed(menu.type as "Lunch" | "Dinner") : false,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return ok({
        ...updated,
        message: "Change request submitted for admin review",
      });
    }

    // ── Admin actions ─────────────────────────────────────────────────────────
    case "confirm_payment": {
      if (!isAdmin) return forbidden();
      const [updated] = await db
        .update(orders)
        .set({ status: "Confirmed", confirmedAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return ok(updated);
    }

    case "start_cooking": {
      if (!isAdmin) return forbidden();
      const [updated] = await db
        .update(orders)
        .set({ status: "Cooking", cookingStartedAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return ok(updated);
    }

    case "out_for_delivery": {
      if (!isAdmin) return forbidden();
      const [updated] = await db
        .update(orders)
        .set({ status: "OutForDelivery", outForDeliveryAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return ok(updated);
    }

    case "deliver": {
      if (!isAdmin) return forbidden();
      const [updated] = await db
        .update(orders)
        .set({ status: "Delivered", deliveredAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      // Increment trust score
      await db
        .update(users)
        .set({ trustScore: order.id ? 1 : 1, updatedAt: new Date() }) // placeholder — use SQL increment below
        .where(eq(users.id, order.userId));

      // Proper increment via raw SQL expression
      await db.execute(
        // drizzle supports sql template literals
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db as any).sql`UPDATE users SET trust_score = trust_score + 1 WHERE id = ${order.userId}`
      );

      return ok(updated);
    }

    case "admin_cancel": {
      if (!isAdmin) return forbidden();
      const [updated] = await db
        .update(orders)
        .set({
          status: "Cancelled",
          cancelReason: cancelReason ?? "Cancelled by admin",
          adminNote: body.adminNote ?? null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();
      return ok(updated);
    }

    default:
      return err(`Unknown action: ${action}`);
  }
}
