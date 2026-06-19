import dotenv from "dotenv";
dotenv.config();

import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: ["./db/schema.ts", "./server/db/schema.ts"],
    out: "./drizzle",
    dbCredentials: {
        url: process.env.DATABASE_URL_POOLED!,
    },
});