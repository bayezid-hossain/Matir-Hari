import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { menus } from "@/db/schema";
import { ok } from "@/lib/response";

/**
 * GET /api/menus/today
 * Returns today's active Lunch and Dinner menus.
 * Also returns current cut-off status for each meal type.
 */
export async function GET(_req: NextRequest) {
  const now = new Date();
  // Bangladesh time is UTC+6
  const bdtOffset = 6 * 60;
  const localMinutes =
    ((now.getUTCHours() * 60 + now.getUTCMinutes() + bdtOffset) % (24 * 60));
  const bdtHour = Math.floor(localMinutes / 60);
  const bdtMinute = localMinutes % 60;

  const todayDow = new Date(
    now.getTime() + bdtOffset * 60_000
  ).getUTCDay(); // 0=Sun

  // Cut-off times (24h, BDT)
  const lunchCutoff = { h: 10, m: 0 };
  const dinnerCutoff = { h: 17, m: 0 };

  const nowMins = bdtHour * 60 + bdtMinute;
  const lunchCutoffMins = lunchCutoff.h * 60 + lunchCutoff.m;
  const dinnerCutoffMins = dinnerCutoff.h * 60 + dinnerCutoff.m;

  const lunchCutoffPassed = nowMins >= lunchCutoffMins;
  const dinnerCutoffPassed = nowMins >= dinnerCutoffMins;

  const todayMenus = await db
    .select()
    .from(menus)
    .where(and(eq(menus.dayOfWeek, todayDow), eq(menus.isActive, true)));

  const lunch = todayMenus.find((m) => m.type === "Lunch") ?? null;
  const dinner = todayMenus.find((m) => m.type === "Dinner") ?? null;

  return ok({
    date: now.toISOString(),
    bdt: { hour: bdtHour, minute: bdtMinute },
    lunch: lunch
      ? {
          ...lunch,
          cutoffPassed: lunchCutoffPassed,
          cutoffTime: "10:00 AM",
        }
      : null,
    dinner: dinner
      ? {
          ...dinner,
          cutoffPassed: dinnerCutoffPassed,
          cutoffTime: "05:00 PM",
        }
      : null,
  });
}
