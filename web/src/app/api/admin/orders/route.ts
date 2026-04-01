import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { orders, menus, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const query = db
    .select({
      id: orders.id,
      status: orders.status,
      trxId: orders.trxId,
      paymentMethod: orders.paymentMethod,
      totalPrice: orders.totalPrice,
      commitmentFee: orders.commitmentFee,
      deliveryFee: orders.deliveryFee,
      cancelReason: orders.cancelReason,
      adminNote: orders.adminNote,
      deliveryAddress: orders.deliveryAddress,
      paymentScreenshot: orders.paymentScreenshot,
      cutOffReached: orders.cutOffReached,
      orderedAt: orders.orderedAt,
      paymentSubmittedAt: orders.paymentSubmittedAt,
      confirmedAt: orders.confirmedAt,
      cookingStartedAt: orders.cookingStartedAt,
      outForDeliveryAt: orders.outForDeliveryAt,
      deliveredAt: orders.deliveredAt,
      updatedAt: orders.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        phone: users.phone,
        trustScore: users.trustScore,
      },
      menu: {
        id: menus.id,
        name: menus.name,
        type: menus.type,
        dayOfWeek: menus.dayOfWeek,
        price: menus.price,
      },
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(menus, eq(orders.menuId, menus.id))
    .orderBy(desc(orders.orderedAt));

  let rows;
  if (status) {
    rows = await db
      .select({
        id: orders.id,
        status: orders.status,
        trxId: orders.trxId,
        paymentMethod: orders.paymentMethod,
        totalPrice: orders.totalPrice,
        commitmentFee: orders.commitmentFee,
        deliveryFee: orders.deliveryFee,
        cancelReason: orders.cancelReason,
        adminNote: orders.adminNote,
        deliveryAddress: orders.deliveryAddress,
        paymentScreenshot: orders.paymentScreenshot,
        cutOffReached: orders.cutOffReached,
        orderedAt: orders.orderedAt,
        paymentSubmittedAt: orders.paymentSubmittedAt,
        confirmedAt: orders.confirmedAt,
        cookingStartedAt: orders.cookingStartedAt,
        outForDeliveryAt: orders.outForDeliveryAt,
        deliveredAt: orders.deliveredAt,
        updatedAt: orders.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          phone: users.phone,
          trustScore: users.trustScore,
        },
        menu: {
          id: menus.id,
          name: menus.name,
          type: menus.type,
          dayOfWeek: menus.dayOfWeek,
          price: menus.price,
        },
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(menus, eq(orders.menuId, menus.id))
      .where(eq(orders.status, status as "PendingPayment" | "Confirmed" | "Cooking" | "OutForDelivery" | "Delivered" | "Cancelled" | "PendingAdminAction"))
      .orderBy(desc(orders.orderedAt));
  } else {
    rows = await query;
  }

  return NextResponse.json({ data: rows });
}
