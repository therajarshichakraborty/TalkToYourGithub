import "@/lib/zod-polyfill";
import { github } from "@corsair-dev/github";
import { createCorsair } from "corsair";
import { pool } from "@/lib/pool";

type CorsairPlugin = NonNullable<
  Parameters<typeof createCorsair>[0]["plugins"]
>[number];

export const corsair = createCorsair({
  database: pool,
  kek: process.env.CORSAIR_KEK!,
  plugins: [github() as unknown as CorsairPlugin],
  multiTenancy: true,
});

export interface CorsairTenant {
  github?: {
    keys?: { set_api_key(key: string): Promise<unknown> };
  };
}

export function corsairTenant(tenantId: string): CorsairTenant {
  return corsair.withTenant(tenantId) as unknown as CorsairTenant;
}
