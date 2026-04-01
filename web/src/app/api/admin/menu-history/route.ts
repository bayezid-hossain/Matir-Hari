import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { db } from "@/db";
import { menuHistory, menus } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * GET /api/admin/menu-history
 * Returns menu history grouped by dayOfWeek + type, most recent entry first within each group.
 */
export async function GET(req: NextRequest) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: menuHistory.id,
      dayOfWeek: menuHistory.dayOfWeek,
      type: menuHistory.type,
      menuId: menuHistory.menuId,
      menuName: menuHistory.menuName,
      menuPrice: menuHistory.menuPrice,
      effectiveFrom: menuHistory.effectiveFrom,
      effectiveUntil: menuHistory.effectiveUntil,
      imageUrl: menus.imageUrl,
    })
    .from(menuHistory)
    .leftJoin(menus, eq(menuHistory.menuId, menus.id))
    .orderBy(
      asc(menuHistory.dayOfWeek),
      asc(menuHistory.type),
      desc(menuHistory.effectiveFrom)
    );

  // Group by dayOfWeek + type
  type Entry = {
    menuId: string;
    menuName: string;
    menuPrice: number;
    effectiveFrom: string;
    effectiveUntil: string | null;
    imageUrl: string | null;
  };
  type Group = {
    dayOfWeek: number;
    dayName: string;
    type: string;
    entries: Entry[];
  };

  const groupMap = new Map<string, Group>();

  for (const row of rows) {
    const key = `${row.dayOfWeek}-${row.type}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        dayOfWeek: row.dayOfWeek,
        dayName: DAY_NAMES[row.dayOfWeek] ?? `Day ${row.dayOfWeek}`,
        type: row.type,
        entries: [],
      });
    }
    groupMap.get(key)!.entries.push({
      menuId: row.menuId,
      menuName: row.menuName,
      menuPrice: row.menuPrice,
      effectiveFrom: row.effectiveFrom,
      effectiveUntil: row.effectiveUntil ?? null,
      imageUrl: row.imageUrl ?? null,
    });
  }

  // Sort groups: by dayOfWeek then Lunch before Dinner
  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return a.type === "Lunch" ? -1 : 1;
  });

  return NextResponse.json({ data: groups });
}
