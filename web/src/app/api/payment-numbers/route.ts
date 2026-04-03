import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentNumbers } from "@/db/schema";

export async function GET() {
  const numbers = await db
    .select()
    .from(paymentNumbers)
    .where(eq(paymentNumbers.isActive, true))
    .orderBy(paymentNumbers.type, paymentNumbers.createdAt);

  return NextResponse.json({ success: true, data: numbers });
}
