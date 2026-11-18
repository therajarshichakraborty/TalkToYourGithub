import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REPOS = 6;
const IGNORED = new Set(["all", "github"]);

interface ActivityGroup {
  owner: string;
  name: string;
  fullName: string;
  latestActivityAt: string;
  summary: string | null;
  activities: Array<{
    id: string;
    type: string;
    title: string | null;
    occurredAt: string;
  }>;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [logs, summaries] = await Promise.all([
      db
        .select()
        .from(schema.activityLogs)
        .where(eq(schema.activityLogs.userId, userId))
        .orderBy(desc(schema.activityLogs.occurredAt))
        .limit(100),
      db
        .select({
          owner: schema.repositorySummaries.repositoryOwner,
          name: schema.repositorySummaries.repositoryName,
          summary: schema.repositorySummaries.summary,
        })
        .from(schema.repositorySummaries)
        .where(eq(schema.repositorySummaries.userId, userId)),
    ]);

    const summaryByRepo = new Map(
      summaries.map((s) => [`${s.owner}/${s.name}`.toLowerCase(), s.summary]),
    );
    const groups = new Map<string, ActivityGroup>();

    for (const log of logs) {
      const owner = log.repositoryOwner;
      const name = log.repositoryName;
      if (!owner || !name) continue;
      if (IGNORED.has(owner.toLowerCase()) || IGNORED.has(name.toLowerCase())) {
        continue;
      }

      const key = `${owner}/${name}`.toLowerCase();
      let group = groups.get(key);
      if (!group) {
        if (groups.size >= MAX_REPOS) continue;
        group = {
          owner,
          name,
          fullName: `${owner}/${name}`,
          latestActivityAt: log.occurredAt.toISOString(),
          summary: summaryByRepo.get(key) ?? null,
          activities: [],
        };
        groups.set(key, group);
      }

      if (group.activities.length < 3) {
        group.activities.push({
          id: log.id,
          type: log.activityType,
          title: log.title ?? log.description,
          occurredAt: log.occurredAt.toISOString(),
        });
      }
    }

    return Response.json({
      success: true,
      repositories: Array.from(groups.values()),
    });
  } catch (error) {
    console.error("[dashboard] activity load failed", error);
    return Response.json(
      { error: "Failed to load recent activity." },
      { status: 500 },
    );
  }
}
