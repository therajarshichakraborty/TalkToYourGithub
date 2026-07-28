import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { corsair } from "@/server/corsair";

export interface ToolContextOptions {
  userId?: string;
  tenantId?: string;
}

export async function getCorsairTenantClient(options: ToolContextOptions) {
  let targetTenantId = options.tenantId;

  if (!targetTenantId && options.userId) {
    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, options.userId));
    targetTenantId = userRecord?.corsairTenantId || undefined;
  }

  if (!targetTenantId) {
    throw new Error("Tenant ID or User ID with valid corsairTenantId must be provided.");
  }

  const tenant = corsair.withTenant(targetTenantId);
  if (!tenant?.github?.api) {
    throw new Error(`Corsair GitHub API client is not initialized for tenant '${targetTenantId}'.`);
  }

  return { tenant, tenantId: targetTenantId };
}
