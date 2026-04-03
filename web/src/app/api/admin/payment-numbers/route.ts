import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { paymentNumbers } from "@/db/schema";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(paymentNumbers)
    .orderBy(desc(paymentNumbers.createdAt));
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { type, number, label } = body as {
    type?: string;
    number?: string;
    label?: string;
  };

  if (!type || !["bKash", "Nagad"].includes(type)) {
    return NextResponse.json({ error: "type must be bKash or Nagad" }, { status: 400 });
  }
  if (!number?.trim()) {
    return NextResponse.json({ error: "number is required" }, { status: 400 });
  }

  const [created] = await db
    .insert(paymentNumbers)
    .values({
      type: type as "bKash" | "Nagad",
      number: number.trim(),
      label: label?.trim() ?? "",
      isActive: true,
    })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
