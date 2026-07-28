import dotenv from "dotenv";
dotenv.config();

import { createCorsair } from "corsair";
import { github } from "@corsair-dev/github";
import { pool } from "@/lib/pool";

export const corsair = createCorsair({
  database: pool,
  kek: process.env.CORSAIR_KEK!,
  plugins: [github()],
  multiTenancy: true,
});
