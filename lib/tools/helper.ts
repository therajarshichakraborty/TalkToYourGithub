import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { corsair } from "@/server/corsair";

export interface ToolContextOptions {
  userId?: string;
  tenantId?: string;
}

export async function getCorsairTenantClient(options: ToolContextOptions) {
  let targetTenantId = options.tenantId;
  let userObj: { id: string; corsairTenantId: string | null } | undefined;

  if (targetTenantId) {
    const [u] = await db
      .select({
        id: schema.user.id,
        corsairTenantId: schema.user.corsairTenantId,
      })
      .from(schema.user)
      .where(eq(schema.user.corsairTenantId, targetTenantId));
    userObj = u;
  } else if (options.userId) {
    const [u] = await db
      .select({
        id: schema.user.id,
        corsairTenantId: schema.user.corsairTenantId,
      })
      .from(schema.user)
      .where(eq(schema.user.id, options.userId));
    userObj = u;
    targetTenantId = userObj?.corsairTenantId || undefined;
  }

  if (!targetTenantId) {
    throw new Error(
      "No connected GitHub account found for this user. Please connect GitHub to initialize tenant sync.",
    );
  }

  const tenant = corsair.withTenant(targetTenantId);
  if (!tenant?.github?.api) {
    throw new Error(
      `Corsair GitHub API client is not initialized for tenant ID '${targetTenantId}'.`,
    );
  }

  if (userObj?.id) {
    const [acc] = await db
      .select({ accessToken: schema.account.accessToken })
      .from(schema.account)
      .where(
        and(
          eq(schema.account.userId, userObj.id),
          eq(schema.account.providerId, "github"),
        ),
      );
    if (acc?.accessToken && tenant?.github?.keys?.set_api_key) {
      await tenant.github.keys.set_api_key(acc.accessToken).catch(() => {});
    }
  }

  return { tenant, tenantId: targetTenantId };
}
