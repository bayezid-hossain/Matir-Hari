import { db } from "@/db";
import { menuHistory } from "@/db/schema";
import { and, eq, isNull, ne } from "drizzle-orm";

/**
 * Records a menu activation event in menu_history.
 * Closes any open entry for the same (dayOfWeek, type) slot if it belongs to a different menu,
 * then inserts a new open entry for the newly active menu.
 * If the exact same menuId is already the open entry, this is a no-op.
 */
export async function recordMenuHistory(
  dayOfWeek: number,
  type: "Lunch" | "Dinner",
  menuId: string,
  menuName: string,
  menuPrice: number
): Promise<void> {
  const today = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);

  // Check if this menuId is already the open entry for this slot
  const existing = await db
    .select({ id: menuHistory.id })
    .from(menuHistory)
    .where(
      and(
        eq(menuHistory.dayOfWeek, dayOfWeek),
        eq(menuHistory.type, type),
        eq(menuHistory.menuId, menuId),
        isNull(menuHistory.effectiveUntil)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Already recorded — nothing to do
    return;
  }

  // Close any other open entry for this slot
  await db
    .update(menuHistory)
    .set({ effectiveUntil: today })
    .where(
      and(
        eq(menuHistory.dayOfWeek, dayOfWeek),
        eq(menuHistory.type, type),
        isNull(menuHistory.effectiveUntil),
        ne(menuHistory.menuId, menuId)
      )
    );

  // Insert new open entry
  await db.insert(menuHistory).values({
    dayOfWeek,
    type,
    menuId,
    menuName,
    menuPrice,
    effectiveFrom: today,
  });
}
