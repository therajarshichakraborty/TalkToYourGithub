/*
 * API route: /api/dashboard/continue-working
 * Description: Fetches developer activity logs and AI repository summaries for the authenticated user,
 * returning structured data for the Continue Working dashboard view.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getRepositories } from "@/lib/tools/get-repositories";

export const runtime = "nodejs";

export async function GET() {
  /* Authenticate user session */
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    /*
     * Fetch recent activity logs from DB ordered by occurrence time
     */
    const logs = await db
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, userId))
      .orderBy(desc(schema.activityLogs.occurredAt))
      .limit(50);

    /*
     * Fetch repository summaries from DB
     */
    const summaries = await db
      .select()
      .from(schema.repositorySummaries)
      .where(eq(schema.repositorySummaries.userId, userId))
      .orderBy(desc(schema.repositorySummaries.updatedAt));

    /* Map summaries by repository key owner/name */
    const summaryMap = new Map<string, string>();
    for (const s of summaries) {
      const key = `${s.repositoryOwner.toLowerCase()}/${s.repositoryName.toLowerCase()}`;
      summaryMap.set(key, s.summary);
    }

    /* Fetch authenticated user's connected GitHub login */
    const [conn] = await db
      .select({ githubLogin: schema.githubConnections.githubLogin })
      .from(schema.githubConnections)
      .where(eq(schema.githubConnections.userId, userId));

    const userGithubLogin =
      conn?.githubLogin ||
      session.user.name ||
      session.user.email?.split("@")[0] ||
      "";

    /*
     * Group activity logs by repository
     */
    const repoGroups = new Map<
      string,
      {
        owner: string;
        name: string;
        fullName: string;
        activities: Array<{
          id: string;
          type: string;
          title: string | null;
          description: string | null;
          occurredAt: string;
        }>;
        latestActivityAt: string;
        summary: string | null;
      }
    >();

    for (const log of logs) {
      if (!log.repositoryOwner || !log.repositoryName) continue;
      if (
        log.repositoryName.toLowerCase() === "all" ||
        log.repositoryOwner.toLowerCase() === "all"
      )
        continue;

      let owner = log.repositoryOwner;
      const name = log.repositoryName;

      if (!owner || owner.toLowerCase() === "github") {
        owner = userGithubLogin;
      }

      const key = `${owner.toLowerCase()}/${name.toLowerCase()}`;

      if (!repoGroups.has(key)) {
        repoGroups.set(key, {
          owner,
          name,
          fullName: `${owner}/${name}`,
          activities: [],
          latestActivityAt: log.occurredAt.toISOString(),
          summary:
            summaryMap.get(key) ||
            summaryMap.get(`github/${name.toLowerCase()}`) ||
            null,
        });
      }

      const group = repoGroups.get(key)!;
      group.activities.push({
        id: log.id,
        type: log.activityType,
        title: log.title,
        description: log.description,
        occurredAt: log.occurredAt.toISOString(),
      });
    }

    /*
     * Also include repositories that have summaries even if they have no recent activity log rows
     */
    for (const s of summaries) {
      if (
        s.repositoryName.toLowerCase() === "all" ||
        s.repositoryOwner.toLowerCase() === "all"
      )
        continue;

      let owner = s.repositoryOwner;
      const name = s.repositoryName;

      if (!owner || owner.toLowerCase() === "github") {
        owner = userGithubLogin;
      }

      const key = `${owner.toLowerCase()}/${name.toLowerCase()}`;
      if (!repoGroups.has(key)) {
        repoGroups.set(key, {
          owner,
          name,
          fullName: `${owner}/${name}`,
          activities: [],
          latestActivityAt: s.updatedAt.toISOString(),
          summary: s.summary,
        });
      }
    }

    /*
     * Include all connected user repositories so all projects (including Development) are listed on dashboard
     */
    try {
      const userReposResult = await getRepositories({ userId, perPage: 100 });
      if (
        userReposResult.success &&
        Array.isArray(userReposResult.repositories)
      ) {
        for (const repoItem of userReposResult.repositories) {
          const r = repoItem?.data || repoItem?.payload || repoItem || {};
          let fullName = r.full_name || r.fullName || "";
          let owner =
            r.owner?.login ||
            (typeof r.owner === "string" ? r.owner : "") ||
            userGithubLogin;
          let name = r.name || "";

          if (fullName && fullName.includes("/")) {
            const parts = fullName.split("/");
            if (!owner) owner = parts[0];
            if (!name) name = parts[1];
          }

          if (!name) continue;

          const key = `${owner.toLowerCase()}/${name.toLowerCase()}`;
          if (!repoGroups.has(key)) {
            repoGroups.set(key, {
              owner,
              name,
              fullName: `${owner}/${name}`,
              activities: [],
              latestActivityAt:
                r.updated_at || r.updatedAt || new Date(0).toISOString(),
              summary: summaryMap.get(key) || null,
            });
          }
        }
      }
    } catch (repoErr) {
      console.warn(
        "[/api/dashboard/continue-working] Note fetching user repositories:",
        repoErr,
      );
    }

    const continueWorkingRepos = Array.from(repoGroups.values()).sort(
      (a, b) =>
        new Date(b.latestActivityAt).getTime() -
        new Date(a.latestActivityAt).getTime(),
    );

    return Response.json({
      success: true,
      count: continueWorkingRepos.length,
      repositories: continueWorkingRepos,
      recentLogs: logs.map((l) => ({
        id: l.id,
        repo: `${l.repositoryOwner}/${l.repositoryName}`,
        type: l.activityType,
        title: l.title,
        description: l.description,
        occurredAt: l.occurredAt.toISOString(),
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      "[/api/dashboard/continue-working] Error fetching dashboard data:",
      message,
    );

    return Response.json(
      { error: "Internal server error loading dashboard data." },
      { status: 500 },
    );
  }
}
