import dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./db/schema.ts"],
  out: "./drizzle",
  // Tell Drizzle to never touch tables owned by Corsair.
  // The '!' prefix means "exclude tables matching this pattern".
  tablesFilter: ["!corsair_*"],
  dbCredentials: {
    url: process.env.DATABASE_URL_POOLED!,
  },
});
