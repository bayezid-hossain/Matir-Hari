import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { config } from "dotenv";

config(); // loads .env
config({ path: ".env.local" }); // loads .env.local

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const SAMPLE_IMAGES = [
  "/sample/bhuna_khichuri.png",
  "/sample/dal_bukhara.png",
  "/sample/malaikari.png",
  "/sample/mishti_doi.png",
  "/sample/shorisha_ilish.png",
];

const MEAL_NAMES = [
  "Bhuna Khichuri",
  "Dal Bukhara",
  "Malaikari",
  "Mishti Doi",
  "Shorisha Ilish",
];

async function seed() {
  console.log("Seeding menus...");
  
  const insertData = [];
  
  for (let day = 0; day < 7; day++) {
    // Lunch
    insertData.push({
      dayOfWeek: day,
      type: "Lunch" as const,
      name: MEAL_NAMES[day % MEAL_NAMES.length] + " Lunch",
      description: "Delicious regular lunch for your daily cravings.",
      itemsDescription: "Rice, Dal, Main Curry, Salad",
      imageUrl: SAMPLE_IMAGES[day % SAMPLE_IMAGES.length],
      price: 150,
      isActive: true,
    });
    
    // Dinner
    insertData.push({
      dayOfWeek: day,
      type: "Dinner" as const,
      name: MEAL_NAMES[(day + 2) % MEAL_NAMES.length] + " Dinner",
      description: "A wonderful dinner to end your day simply and effectively.",
      itemsDescription: "Roti/Rice, Special Curry, Dessert",
      imageUrl: SAMPLE_IMAGES[(day + 2) % SAMPLE_IMAGES.length],
      price: 200,
      isActive: true,
    });
  }
  
  await db.insert(schema.menus).values(insertData);
  console.log("Seeded 14 menus successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Failed to seed menus:");
  console.error(err);
  process.exit(1);
});
