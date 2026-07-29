/*
 * API route: /api/inngest/trigger
 * Description: Enables users to trigger Inngest background functions on demand
 * for generating repository summaries, embeddings, and activity logs.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { inngest } from "@/inngest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  /* Authenticate user session */
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    const { eventName = "github.connected", repositoryOwner, repositoryName } = await req.json();

    /* Resolve user's corsairTenantId */
    const [u] = await db
      .select({ corsairTenantId: schema.user.corsairTenantId })
      .from(schema.user)
      .where(eq(schema.user.id, userId));

    const corsairTenantId = u?.corsairTenantId || undefined;

    /* Dispatch Inngest event */
    const { ids } = await inngest.send({
      name: eventName,
      data: {
        userId,
        corsairTenantId,
        repositoryOwner,
        repositoryName,
      },
    });

    console.log(`[/api/inngest/trigger] Dispatched '${eventName}' event (IDs: ${ids.join(", ")})`);

    return Response.json({
      success: true,
      eventName,
      eventIds: ids,
      message: `Successfully triggered Inngest background job '${eventName}'.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/inngest/trigger] Error dispatching event:", message);

    return Response.json(
      { error: `Failed to trigger Inngest event: ${message}` },
      { status: 500 }
    );
  }
}
