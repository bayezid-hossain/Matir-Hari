/**
 * Seed script — run with:
 *   npx tsx scripts/reset-db.ts
 *
 * Clears all tables and inserts sample menus for the current week.
 * Requires DATABASE_URL in .env (Neon connection string).
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { menus, orders, sessions, users, notifications } from "../src/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const SAMPLE_MENUS = [
  // Lunch — every day (0–6)
  ...Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    type: "Lunch" as const,
    name: "Gram-Bangla Bhojon",
    description: "Steamed Atap Rice, Signature Masoor Dal, Begun Bhorta, and Shorshe Ilish (Hilsa in Mustard).",
    itemsDescription: "Rice · Masoor Dal · Begun Bhorta · Shorshe Ilish",
    imageUrl: null,
    price: 450,
    isActive: true,
  })),
  // Dinner — every day (0–6)
  ...Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    type: "Dinner" as const,
    name: "Rajbari Special",
    description: "Handmade Luchi, Mutton Rezala (Slow-cooked), Cholar Dal, and Mishti Doi dessert.",
    itemsDescription: "Luchi · Mutton Rezala · Cholar Dal · Mishti Doi",
    imageUrl: null,
    price: 620,
    isActive: true,
  })),
];

async function main() {
  console.log("🧹 Clearing tables…");
  await db.delete(notifications);
  await db.delete(orders);
  await db.delete(sessions);
  await db.delete(users);
  await db.delete(menus);

  console.log("🌱 Inserting sample menus…");
  await db.insert(menus).values(SAMPLE_MENUS);

  console.log(`✅ Done — inserted ${SAMPLE_MENUS.length} menu rows.`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
