import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, err } from "@/lib/response";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
 
/**
 * POST /api/users/me/push-token
 * Body: { token: string }
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
 
  const body = await req.json().catch(() => null);
  if (!body || !body.token) return err("Token is required");
 
  await db
    .update(users)
    .set({ expoPushToken: body.token, updatedAt: new Date() })
    .where(eq(users.id, auth.sub));
 
  return ok({ message: "Push token updated" });
}
