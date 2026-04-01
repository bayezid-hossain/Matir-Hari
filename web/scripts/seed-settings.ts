import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config(); // loads .env
config({ path: ".env.local" }); // loads .env.local

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  await sql`
    INSERT INTO settings (key, value, updated_at) VALUES
      ('delivery_fee_mode',   'fixed',    NOW()),
      ('delivery_fee_fixed',  '30',       NOW()),
      ('delivery_fee_base',   '20',       NOW()),
      ('delivery_fee_per_km', '5',        NOW()),
      ('kitchen_lat',         '24.7471',  NOW()),
      ('kitchen_lng',         '90.4203',  NOW())
    ON CONFLICT (key) DO NOTHING
  `;
  console.log("Default settings seeded successfully.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
