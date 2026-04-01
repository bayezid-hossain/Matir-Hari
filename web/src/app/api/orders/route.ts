import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, menus } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { ok, created, err, unauthorized } from "@/lib/response";
import { getAppSettings } from "@/app/api/admin/settings/route";

/** Haversine distance between two lat/lng points in km. */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/orders
 * Returns all orders for the authenticated user (most recent first).
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const rows = await db
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
      deliveryDate: orders.deliveryDate,
      menuSnapshot: orders.menuSnapshot,
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

  const userOrders = rows.map(({ menuSnapshot, menu, ...rest }) => ({
    ...rest,
    menu: (menuSnapshot as typeof menu | null) ?? menu,
  }));

  return ok(userOrders);
}

/**
 * POST /api/orders
 * Body: { menuId, deliveryAddress, deliveryDate? }
 * Creates a new order with status PendingPayment.
 * For future deliveryDate (YYYY-MM-DD in BDT), the cut-off check is skipped.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { menuId, deliveryAddress, deliveryDate } = body as {
    menuId?: string;
    deliveryAddress?: unknown;
    deliveryDate?: string;
  };

  if (!menuId) return err("menuId is required");
  if (!deliveryAddress) return err("deliveryAddress is required");

  // Validate deliveryDate if provided
  const now = new Date();
  const bdtOffset = 6 * 60;
  const bdtNow = new Date(now.getTime() + bdtOffset * 60_000);
  const bdtTodayStr = bdtNow.toISOString().slice(0, 10);

  if (deliveryDate !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
      return err("Invalid deliveryDate format. Use YYYY-MM-DD.", 400);
    }
    if (deliveryDate < bdtTodayStr) {
      return err("deliveryDate cannot be in the past.", 400);
    }
    const maxDate = new Date(bdtNow.getTime() + 3 * 24 * 60 * 60_000)
      .toISOString()
      .slice(0, 10);
    if (deliveryDate > maxDate) {
      return err("Pre-orders only available up to 3 days ahead.", 400);
    }
  }

  const effectiveDate = deliveryDate ?? bdtTodayStr;
  const isToday = effectiveDate === bdtTodayStr;

  const [menu] = await db
    .select()
    .from(menus)
    .where(eq(menus.id, menuId))
    .limit(1);

  if (!menu || !menu.isActive) return err("Menu not found or inactive", 404);

  // Load delivery fee from settings
  const appSettings = await getAppSettings();
  let deliveryFee = appSettings.delivery_fee_fixed;

  if (appSettings.delivery_fee_mode === "auto") {
    const addr = deliveryAddress as { lat?: number; lng?: number } | null;
    if (addr?.lat != null && addr?.lng != null) {
      const distKm = haversineKm(
        appSettings.kitchen_lat,
        appSettings.kitchen_lng,
        addr.lat,
        addr.lng
      );
      deliveryFee = appSettings.delivery_fee_base + Math.round(distKm * appSettings.delivery_fee_per_km);
    } else {
      // Fallback to base fee if coordinates are missing
      deliveryFee = appSettings.delivery_fee_base;
    }
  }

  // Check cut-off only for same-day orders
  const localMinutes =
    ((now.getUTCHours() * 60 + now.getUTCMinutes() + bdtOffset) % (24 * 60));
  const bdtHour = Math.floor(localMinutes / 60);
  const bdtMinute = localMinutes % 60;
  const nowMins = bdtHour * 60 + bdtMinute;

  const cutoffMins = menu.type === "Lunch" ? 10 * 60 : 17 * 60;
  const cutOffReached = isToday && nowMins >= cutoffMins;

  if (isToday && cutOffReached) {
    return err(
      `Cut-off time has passed for ${menu.type}. Orders are closed.`,
      400
    );
  }

  const menuSnapshot = {
    id: menu.id,
    name: menu.name,
    type: menu.type,
    description: menu.description,
    itemsDescription: menu.itemsDescription,
    imageUrl: menu.imageUrl,
    price: menu.price,
  };

  const [order] = await db
    .insert(orders)
    .values({
      userId: auth.sub,
      menuId,
      totalPrice: menu.price,
      deliveryFee,
      commitmentFee: 50,
      deliveryAddress,
      deliveryDate: effectiveDate,
      menuSnapshot,
      cutOffReached: false,
    })
    .returning();

  return created(order);
}
