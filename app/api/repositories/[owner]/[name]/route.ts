/*
 * API route: /api/repositories/[owner]/[name]
 * Description: Retrieves detailed metadata, AI summary, activity logs, and signals for a specific repository.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCommits } from "@/lib/tools/get-commits";
import { getBranches } from "@/lib/tools/get-branches";
import { getPullRequests } from "@/lib/tools/get-pull-requests";
import { getIssues } from "@/lib/tools/get-issues";
import { getFileContent } from "@/lib/tools/get-file-content";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  props: { params: Promise<{ owner: string; name: string }> },
) {
  /* Authenticate user session */
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized access" }, { status: 401 });
  }

  const { owner, name } = await props.params;
  const userId = session.user.id;

  try {
    /*
     * 1. Query repository summary from database
     */
    const [summaryRow] = await db
      .select()
      .from(schema.repositorySummaries)
      .where(
        and(
          eq(schema.repositorySummaries.userId, userId),
          eq(schema.repositorySummaries.repositoryOwner, owner),
          eq(schema.repositorySummaries.repositoryName, name),
        ),
      )
      .limit(1);

    /*
     * 2. Query activity logs from database for this repository
     */
    const activityLogs = await db
      .select()
      .from(schema.activityLogs)
      .where(
        and(
          eq(schema.activityLogs.userId, userId),
          eq(schema.activityLogs.repositoryOwner, owner),
          eq(schema.activityLogs.repositoryName, name),
        ),
      )
      .orderBy(desc(schema.activityLogs.occurredAt))
      .limit(30);

    /*
     * 3. Fetch live context (commits, branches, PRs, issues, README)
     */
    const [commitsRes, branchesRes, prsRes, issuesRes, readmeRes] =
      await Promise.allSettled([
        getCommits({ userId, owner, repo: name, perPage: 100 }),
        getBranches({ userId, owner, repo: name, perPage: 100 }),
        getPullRequests({
          userId,
          owner,
          repo: name,
          state: "all",
          perPage: 100,
        }),
        getIssues({ userId, owner, repo: name, state: "all", perPage: 100 }),
        getFileContent({ userId, owner, repo: name, path: "README.md" }),
      ]);

    const commits =
      commitsRes.status === "fulfilled" && commitsRes.value.success
        ? commitsRes.value.commits
        : [];
    const branches =
      branchesRes.status === "fulfilled" && branchesRes.value.success
        ? (branchesRes.value.branches as any[])
        : [];
    const pullRequests =
      prsRes.status === "fulfilled" && prsRes.value.success
        ? prsRes.value.pullRequests
        : [];
    const issues =
      issuesRes.status === "fulfilled" && issuesRes.value.success
        ? issuesRes.value.issues
        : [];
    const readme =
      readmeRes.status === "fulfilled" && readmeRes.value.success
        ? readmeRes.value.content
        : null;

    return Response.json({
      success: true,
      owner,
      name,
      fullName: `${owner}/${name}`,
      summary: summaryRow?.summary || null,
      summaryGeneratedAt: summaryRow?.generatedAt || null,
      activityLogs: activityLogs.map((l) => ({
        id: l.id,
        type: l.activityType,
        title: l.title,
        description: l.description,
        occurredAt: l.occurredAt.toISOString(),
      })),
      stats: {
        commitsCount: commits.length,
        branchesCount: branches.length,
        pullRequestsCount: pullRequests.length,
        issuesCount: issues.length,
      },
      commits: commits.slice(0, 5).map((c: any) => ({
        message: c.commit?.message || c.message || "",
        author: c.commit?.author?.name || c.author || "Unknown",
        date: c.commit?.author?.date || c.date || "",
        sha: c.sha ? String(c.sha).slice(0, 7) : "",
      })),
      branches: branches
        .slice(0, 5)
        .map((b: any) => (typeof b === "string" ? b : b?.name || ""))
        .filter(Boolean),
      readmeSnippet: readme ? readme.slice(0, 2000) : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[/api/repositories/${owner}/${name}] Error fetching repo details:`,
      message,
    );

    return Response.json(
      { error: `Internal server error loading repository ${owner}/${name}` },
      { status: 500 },
    );
  }
}
