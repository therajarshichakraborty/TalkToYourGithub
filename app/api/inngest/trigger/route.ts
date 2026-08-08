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
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  /* Authenticate user session */
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json().catch(() => ({}));
    let { eventName, repositoryOwner, repositoryName } = body;

    /* Resolve user's corsairTenantId */
    const [u] = await db
      .select({ corsairTenantId: schema.user.corsairTenantId })
      .from(schema.user)
      .where(eq(schema.user.id, userId));

    const corsairTenantId = u?.corsairTenantId || undefined;

    /* Auto-resolve repository owner and name if not provided */
    if (!repositoryOwner || !repositoryName) {
      const [latestSummary] = await db
        .select({
          owner: schema.repositorySummaries.repositoryOwner,
          name: schema.repositorySummaries.repositoryName,
        })
        .from(schema.repositorySummaries)
        .where(eq(schema.repositorySummaries.userId, userId))
        .orderBy(desc(schema.repositorySummaries.updatedAt))
        .limit(1);

      if (latestSummary?.owner && latestSummary?.name) {
        repositoryOwner = repositoryOwner || latestSummary.owner;
        repositoryName = repositoryName || latestSummary.name;
      } else {
        const [conn] = await db
          .select({ githubLogin: schema.githubConnections.githubLogin })
          .from(schema.githubConnections)
          .where(eq(schema.githubConnections.userId, userId))
          .limit(1);

        repositoryOwner =
          repositoryOwner || conn?.githubLogin || "therajarshichakraborty";
        repositoryName = repositoryName || "TalkToYourGithub";
      }
    }

    const payload = {
      userId,
      corsairTenantId,
      repositoryOwner,
      repositoryName,
    };

    let eventsToSend = [];
    if (!eventName || eventName === "github.connected" || eventName === "all") {
      eventsToSend = [
        { name: "github.connected", data: payload },
        { name: "embeddings.generate", data: payload },
        { name: "repo.summary.generate", data: payload },
        { name: "activity.update", data: payload },
      ];
    } else {
      eventsToSend = [{ name: eventName, data: payload }];
    }

    /* Dispatch Inngest events */
    const { ids } = await inngest.send(eventsToSend);

    console.log(
      `[/api/inngest/trigger] Dispatched ${eventsToSend.length} event(s) for ${repositoryOwner}/${repositoryName} (IDs: ${ids.join(", ")})`,
    );

    return Response.json({
      success: true,
      eventName: eventName || "all",
      repositoryOwner,
      repositoryName,
      eventIds: ids,
      message: `Successfully triggered Inngest sync for ${repositoryOwner}/${repositoryName}.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/inngest/trigger] Error dispatching event:", message);

    return Response.json(
      { error: `Failed to trigger Inngest event: ${message}` },
      { status: 500 },
    );
  }
}
