import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon serverless HTTP driver — works in both Node.js and Edge runtimes.
 * Connection string must be set via DATABASE_URL env var.
 */
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
