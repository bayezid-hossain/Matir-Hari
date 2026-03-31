import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, signToken } from "@/lib/auth";
import { ok, err, created } from "@/lib/response";

/**
 * POST /api/auth/register
 * Body: { name, phone, password }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { name, phone, password } = body as {
    name?: string;
    phone?: string;
    password?: string;
  };

  if (!name?.trim()) return err("Name is required");
  if (!phone?.trim()) return err("Phone is required");
  if (!password || password.length < 6)
    return err("Password must be at least 6 characters");

  // Normalise phone — strip spaces
  const normalizedPhone = phone.replace(/\s+/g, "");

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.phone, normalizedPhone))
    .limit(1);

  if (existing.length > 0) return err("Phone number already registered", 409);

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ name: name.trim(), phone: normalizedPhone, passwordHash })
    .returning({ id: users.id, name: users.name, phone: users.phone, trustScore: users.trustScore });

  const token = await signToken({ sub: user.id, phone: user.phone });

  return created({ user, token });
}
