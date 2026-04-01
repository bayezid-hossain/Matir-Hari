import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { menus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { recordMenuHistory } from "@/lib/menu-history";

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

  const { name, description, itemsDescription, imageUrl, price, isActive } = body as {
    name?: string;
    description?: string;
    itemsDescription?: string;
    imageUrl?: string;
    price?: number;
    isActive?: boolean;
  };

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) update.name = name.trim();
  if (description !== undefined) update.description = description.trim();
  if (itemsDescription !== undefined) update.itemsDescription = itemsDescription.trim();
  if (imageUrl !== undefined) update.imageUrl = imageUrl.trim() || null;
  if (price !== undefined) update.price = Number(price);
  if (isActive !== undefined) update.isActive = Boolean(isActive);

  const [updated] = await db
    .update(menus)
    .set(update)
    .where(eq(menus.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Menu not found" }, { status: 404 });

  if (updated.isActive) {
    await recordMenuHistory(
      updated.dayOfWeek,
      updated.type,
      updated.id,
      updated.name,
      updated.price
    );
  }

  return NextResponse.json({ data: updated });
}
