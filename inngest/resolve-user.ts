import { eq } from "drizzle-orm";
import { NonRetriableError } from "inngest";
import { db } from "@/db";
import * as schema from "@/db/schema";

export interface EventUser {
  userId: string;
  corsairTenantId: string | undefined;
}

export const SYNC_DEBOUNCE = {
  key: 'event.data.userId + ":" + event.data.repositoryOwner + "/" + event.data.repositoryName',
  period: "20s",
  timeout: "2m",
} as const;

export async function resolveEventUser(data: {
  userId: string;
}): Promise<EventUser> {
  const [row] = await db
    .select({ id: schema.user.id, tenantId: schema.user.corsairTenantId })
    .from(schema.user)
    .where(eq(schema.user.id, data.userId))
    .limit(1);

  if (!row) {
    throw new NonRetriableError("Event has no resolvable user.");
  }

  return { userId: row.id, corsairTenantId: row.tenantId ?? undefined };
}
