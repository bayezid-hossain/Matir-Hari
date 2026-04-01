import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { menus } from "@/db/schema";
import { asc } from "drizzle-orm";
import { recordMenuHistory } from "@/lib/menu-history";

export async function GET(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(menus)
    .orderBy(asc(menus.dayOfWeek), asc(menus.type));

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { dayOfWeek, type, name, description, itemsDescription, imageUrl, price, isActive } = body;

  if (dayOfWeek === undefined || !type || !name || !description || !itemsDescription || price === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [inserted] = await db
    .insert(menus)
    .values({
      dayOfWeek: Number(dayOfWeek),
      type: type as "Lunch" | "Dinner",
      name: name.trim(),
      description: description.trim(),
      itemsDescription: itemsDescription.trim(),
      imageUrl: imageUrl?.trim() || null,
      price: Number(price),
      isActive: isActive ?? true,
    })
    .returning();

  if (inserted.isActive) {
    await recordMenuHistory(
      inserted.dayOfWeek,
      inserted.type,
      inserted.id,
      inserted.name,
      inserted.price
    );
  }

  return NextResponse.json({ data: inserted }, { status: 201 });
}
