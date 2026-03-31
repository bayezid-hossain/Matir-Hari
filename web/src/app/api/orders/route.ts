import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, menus } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { ok, created, err, unauthorized } from "@/lib/response";

/**
 * GET /api/orders
 * Returns all orders for the authenticated user (most recent first).
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const userOrders = await db
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
      orderedAt: orders.orderedAt,
      confirmedAt: orders.confirmedAt,
      deliveredAt: orders.deliveredAt,
      updatedAt: orders.updatedAt,
      menu: {
        id: menus.id,
        name: menus.name,
        type: menus.type,
        description: menus.description,
        imageUrl: menus.imageUrl,
        price: menus.price,
      },
    })
    .from(orders)
    .innerJoin(menus, eq(orders.menuId, menus.id))
    .where(eq(orders.userId, auth.sub))
    .orderBy(desc(orders.orderedAt));

  return ok(userOrders);
}

/**
 * POST /api/orders
 * Body: { menuId, deliveryAddress }
 * Creates a new order with status PendingPayment.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { menuId, deliveryAddress } = body as {
    menuId?: string;
    deliveryAddress?: unknown;
  };

  if (!menuId) return err("menuId is required");
  if (!deliveryAddress) return err("deliveryAddress is required");

  const [menu] = await db
    .select()
    .from(menus)
    .where(eq(menus.id, menuId))
    .limit(1);

  if (!menu || !menu.isActive) return err("Menu not found or inactive", 404);

  // Check cut-off time
  const now = new Date();
  const bdtOffset = 6 * 60;
  const localMinutes =
    ((now.getUTCHours() * 60 + now.getUTCMinutes() + bdtOffset) % (24 * 60));
  const bdtHour = Math.floor(localMinutes / 60);
  const bdtMinute = localMinutes % 60;
  const nowMins = bdtHour * 60 + bdtMinute;

  const cutoffMins = menu.type === "Lunch" ? 10 * 60 : 17 * 60;
  const cutOffReached = nowMins >= cutoffMins;

  if (cutOffReached) {
    return err(
      `Cut-off time has passed for ${menu.type}. Orders are closed.`,
      400
    );
  }

  const [order] = await db
    .insert(orders)
    .values({
      userId: auth.sub,
      menuId,
      totalPrice: menu.price,
      deliveryFee: 30,
      commitmentFee: 50,
      deliveryAddress,
      cutOffReached: false,
    })
    .returning();

  return created(order);
}
