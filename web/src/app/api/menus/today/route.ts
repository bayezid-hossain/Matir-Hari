import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { menus } from "@/db/schema";
import { ok, err } from "@/lib/response";

/**
 * GET /api/menus/today?date=YYYY-MM-DD
 * Returns active Lunch and Dinner menus for the given date (or today if omitted).
 * Accepts pre-orders up to 3 days ahead. Rejects past dates.
 */
export async function GET(req: NextRequest) {
  const now = new Date();
  // Bangladesh time is UTC+6
  const bdtOffset = 6 * 60;
  const bdtNow = new Date(now.getTime() + bdtOffset * 60_000);
  const bdtTodayStr = bdtNow.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const dateParam = req.nextUrl.searchParams.get("date") ?? bdtTodayStr;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return err("Invalid date format. Use YYYY-MM-DD.", 400);
  }

  // Reject past dates
  if (dateParam < bdtTodayStr) {
    return err("Cannot query past dates.", 400);
  }

  // Reject dates more than 3 days ahead
  const maxDate = new Date(bdtNow.getTime() + 3 * 24 * 60 * 60_000)
    .toISOString()
    .slice(0, 10);
  if (dateParam > maxDate) {
    return err("Pre-orders only available up to 3 days ahead.", 400);
  }

  const isToday = dateParam === bdtTodayStr;

  // Compute cut-off status (only relevant for today)
  const localMinutes =
    ((now.getUTCHours() * 60 + now.getUTCMinutes() + bdtOffset) % (24 * 60));
  const bdtHour = Math.floor(localMinutes / 60);
  const bdtMinute = localMinutes % 60;
  const nowMins = bdtHour * 60 + bdtMinute;
  const lunchCutoffPassed = isToday ? nowMins >= 600 : false;  // 10:00 AM
  const dinnerCutoffPassed = isToday ? nowMins >= 1020 : false; // 5:00 PM

  // Compute day of week for the requested date
  const [y, m, d] = dateParam.split("-").map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d));
  const targetDow = targetDate.getUTCDay(); // 0=Sun

  const dayMenus = await db
    .select()
    .from(menus)
    .where(and(eq(menus.dayOfWeek, targetDow), eq(menus.isActive, true)));

  const lunch = dayMenus.find((menu) => menu.type === "Lunch") ?? null;
  const dinner = dayMenus.find((menu) => menu.type === "Dinner") ?? null;

  return ok({
    date: now.toISOString(),
    requestedDate: dateParam,
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
