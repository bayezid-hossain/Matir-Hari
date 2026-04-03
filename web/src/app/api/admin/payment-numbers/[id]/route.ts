import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentNumbers } from "@/db/schema";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

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

  const { type, number, label, isActive } = body as {
    type?: string;
    number?: string;
    label?: string;
    isActive?: boolean;
  };

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (type && ["bKash", "Nagad"].includes(type)) updates.type = type;
  if (number !== undefined) updates.number = number.trim();
  if (label !== undefined) updates.label = label.trim();
  if (isActive !== undefined) updates.isActive = isActive;

  const [updated] = await db
    .update(paymentNumbers)
    .set(updates)
    .where(eq(paymentNumbers.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(paymentNumbers).where(eq(paymentNumbers.id, id));
  return NextResponse.json({ data: { deleted: true } });
}
