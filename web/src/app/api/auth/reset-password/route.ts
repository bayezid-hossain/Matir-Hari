import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { ok, err, notFound } from "@/lib/response";

/**
 * POST /api/auth/reset-password
 * Body: { phone, newPassword }
 * 
 * In a real application, you would also verify an OTP or a token here.
 * For this flow, we will simulate the OTP verification entirely on the 
 * frontend and allow this endpoint to update the password directly.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { phone, newPassword } = body as { phone?: string; newPassword?: string };

  if (!phone?.trim()) return err("Phone is required");
  if (!newPassword || newPassword.length < 6) return err("New password must be at least 6 characters");

  const normalizedPhone = phone.replace(/\s+/g, "");

  // Find user by phone
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  if (!user) {
    return notFound("User not found with this phone number");
  }

  // Hash the new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update user with new password hash
  await db
    .update(users)
    .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return ok({ message: "Password updated successfully" });
}
