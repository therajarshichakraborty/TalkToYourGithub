import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "@/lib/pool";

export const db = drizzle(pool);