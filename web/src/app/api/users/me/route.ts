import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { ok, err, unauthorized, notFound } from "@/lib/response";

/**
 * GET /api/users/me
 * Returns the authenticated user's profile.
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      trustScore: users.trustScore,
      locationData: users.locationData,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, auth.sub))
    .limit(1);

  if (!user) return notFound("User not found");

  // Derive trust score perks
  const COD_THRESHOLD = 5;
  const perks = {
    codUnlocked: user.trustScore >= COD_THRESHOLD,
    ordersUntilCod: Math.max(0, COD_THRESHOLD - user.trustScore),
    progressPercent: Math.min(100, Math.round((user.trustScore / COD_THRESHOLD) * 100)),
  };

  return ok({ ...user, perks });
}

/**
 * PATCH /api/users/me
 * Body: { name?, locationData? }
 */
export async function PATCH(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid JSON");

  const { name, locationData } = body as {
    name?: string;
    locationData?: unknown;
  };

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (name !== undefined) {
    if (!name.trim()) return err("Name cannot be empty");
    updates.name = name.trim();
  }
  if (locationData !== undefined) {
    updates.locationData = locationData;
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, auth.sub))
    .returning({
      id: users.id,
      name: users.name,
      phone: users.phone,
      trustScore: users.trustScore,
      locationData: users.locationData,
    });

  return ok(updated);
}
