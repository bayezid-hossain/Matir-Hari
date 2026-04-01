import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_KEYS = [
  "delivery_fee_mode",
  "delivery_fee_fixed",
  "delivery_fee_base",
  "delivery_fee_per_km",
  "kitchen_lat",
  "kitchen_lng",
] as const;

type SettingKey = (typeof ALLOWED_KEYS)[number];

export type AppSettings = {
  delivery_fee_mode: "fixed" | "auto";
  delivery_fee_fixed: number;
  delivery_fee_base: number;
  delivery_fee_per_km: number;
  kitchen_lat: number;
  kitchen_lng: number;
};

/** Read all settings rows and return as typed object. */
export async function getAppSettings(): Promise<AppSettings> {
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    delivery_fee_mode: (map["delivery_fee_mode"] ?? "fixed") as "fixed" | "auto",
    delivery_fee_fixed: Number(map["delivery_fee_fixed"] ?? 30),
    delivery_fee_base: Number(map["delivery_fee_base"] ?? 20),
    delivery_fee_per_km: Number(map["delivery_fee_per_km"] ?? 5),
    kitchen_lat: Number(map["kitchen_lat"] ?? 24.7471),
    kitchen_lng: Number(map["kitchen_lng"] ?? 90.4203),
  };
}

/**
 * GET /api/admin/settings
 * Returns all app settings as a flat object.
 */
export async function GET(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appSettings = await getAppSettings();
  return NextResponse.json({ data: appSettings });
}

/**
 * PATCH /api/admin/settings
 * Body: Partial<AppSettings> — only provided keys are updated.
 */
export async function PATCH(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Array<{ key: SettingKey; value: string }> = [];

  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      const raw = body[key];
      if (raw === undefined || raw === null) continue;

      if (key === "delivery_fee_mode") {
        if (raw !== "fixed" && raw !== "auto") {
          return NextResponse.json(
            { error: "delivery_fee_mode must be 'fixed' or 'auto'" },
            { status: 400 }
          );
        }
        updates.push({ key, value: raw });
      } else {
        const num = Number(raw);
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { error: `${key} must be a non-negative number` },
            { status: 400 }
          );
        }
        updates.push({ key, value: String(raw) });
      }
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "No valid settings to update" }, { status: 400 });
  }

  await Promise.all(
    updates.map(({ key, value }) =>
      db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
    )
  );

  const updated = await getAppSettings();
  return NextResponse.json({ data: updated });
}
