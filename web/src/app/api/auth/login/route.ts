import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, signToken } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/response";

/**
 * POST /api/auth/login
 * Body: { phone, password }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { phone, password } = body as { phone?: string; password?: string };

  if (!phone?.trim()) return err("Phone is required");
  if (!password) return err("Password is required");

  const normalizedPhone = phone.replace(/\s+/g, "");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  if (!user) return unauthorized("Invalid phone or password");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return unauthorized("Invalid phone or password");

  const token = await signToken({ sub: user.id, phone: user.phone });

  return ok({
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      trustScore: user.trustScore,
    },
    token,
  });
}
