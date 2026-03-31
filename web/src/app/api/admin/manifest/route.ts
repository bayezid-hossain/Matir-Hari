import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { orders, menus, users } from "@/db/schema";
import { eq, and, gte, inArray } from "drizzle-orm";

function todayBDTRange(): { start: Date; end: Date } {
  const now = new Date();
  const bdtOffset = 6 * 60 * 60 * 1000;
  const bdtNow = new Date(now.getTime() + bdtOffset);
  const startBDT = new Date(
    Date.UTC(bdtNow.getUTCFullYear(), bdtNow.getUTCMonth(), bdtNow.getUTCDate())
  );
  const endBDT = new Date(startBDT.getTime() + 24 * 60 * 60 * 1000);
  return {
    start: new Date(startBDT.getTime() - bdtOffset),
    end: new Date(endBDT.getTime() - bdtOffset),
  };
}

export async function GET(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { start } = todayBDTRange();

  // Confirmed, Cooking, OutForDelivery, Delivered orders placed today
  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      commitmentFee: orders.commitmentFee,
      deliveryFee: orders.deliveryFee,
      paymentMethod: orders.paymentMethod,
      trxId: orders.trxId,
      deliveryAddress: orders.deliveryAddress,
      orderedAt: orders.orderedAt,
      confirmedAt: orders.confirmedAt,
      outForDeliveryAt: orders.outForDeliveryAt,
      deliveredAt: orders.deliveredAt,
      adminNote: orders.adminNote,
      user: {
        id: users.id,
        name: users.name,
        phone: users.phone,
      },
      menu: {
        id: menus.id,
        name: menus.name,
        type: menus.type,
        price: menus.price,
      },
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(menus, eq(orders.menuId, menus.id))
    .where(
      and(
        gte(orders.orderedAt, start),
        inArray(orders.status, ["Confirmed", "Cooking", "OutForDelivery", "Delivered"])
      )
    )
    .orderBy(menus.type, users.name);

  return NextResponse.json({ data: rows });
}
