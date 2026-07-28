import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { corsair } from "@/server/corsair";
import { pool } from "@/lib/pool";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user from DB to verify corsairTenantId
    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id));

    if (!userRecord || !userRecord.corsairTenantId) {
      return NextResponse.json(
        {
          authenticated: true,
          tenantProvisioned: false,
          error: "No corsairTenantId found on user row. Please sign in via GitHub OAuth.",
        },
        { status: 400 }
      );
    }

    const tenantId = userRecord.corsairTenantId;
    const tenant = corsair.withTenant(tenantId);

    if (!tenant?.github?.api) {
      return NextResponse.json(
        { error: "Corsair GitHub API client not initialized." },
        { status: 500 }
      );
    }

    // 1. Query live GitHub API via Corsair
    let repositories: Awaited<ReturnType<typeof tenant.github.api.repositories.list>> = [];
    let branches: Awaited<ReturnType<typeof tenant.github.api.repositories.listBranches>> = [];
    let commits: Awaited<ReturnType<typeof tenant.github.api.repositories.listCommits>> = [];
    let pullRequests: Awaited<ReturnType<typeof tenant.github.api.pullRequests.list>> = [];
    let issues: Awaited<ReturnType<typeof tenant.github.api.issues.list>> = [];
    let apiError: string | null = null;
    let targetRepo: { owner: string; repo: string } | null = null;

    try {
      repositories = await tenant.github.api.repositories.list({ perPage: 10 });

      if (repositories.length > 0) {
        const firstRepo = repositories[0];
        const owner = firstRepo.owner?.login || firstRepo.owner?.name || firstRepo.fullName?.split("/")[0];
        const repoName = firstRepo.name;

        if (owner && repoName) {
          targetRepo = { owner, repo: repoName };

          // Fetch branches, commits, PRs, and issues for the target repo
          const [branchesRes, commitsRes, prsRes, issuesRes] = await Promise.allSettled([
            tenant.github.api.repositories.listBranches({ owner, repo: repoName }),
            tenant.github.api.repositories.listCommits({ owner, repo: repoName, perPage: 10 }),
            tenant.github.api.pullRequests.list({ owner, repo: repoName, perPage: 10 }),
            tenant.github.api.issues.list({ owner, repo: repoName, perPage: 10 }),
          ]);

          if (branchesRes.status === "fulfilled") branches = branchesRes.value;
          if (commitsRes.status === "fulfilled") commits = commitsRes.value;
          if (prsRes.status === "fulfilled") pullRequests = prsRes.value;
          if (issuesRes.status === "fulfilled") issues = issuesRes.value;
        }
      }
    } catch (err: unknown) {
      apiError = err instanceof Error ? err.message : String(err);
    }

    // 2. Query Corsair local database entities table
    const dbEntitiesCount: Record<string, number> = {};
    let totalDbEntities = 0;
    try {
      const dbRes = await pool.query(
        `SELECT entity_type, COUNT(*)::int as count FROM corsair_entities WHERE account_id IN (SELECT id FROM corsair_accounts WHERE tenant_id = $1) GROUP BY entity_type`,
        [tenantId]
      );
      for (const row of dbRes.rows) {
        dbEntitiesCount[row.entity_type] = row.count;
        totalDbEntities += row.count;
      }
    } catch (dbErr) {
      console.error("[Test Sync DB Error]:", dbErr);
    }

    return NextResponse.json({
      success: true,
      tenantId,
      targetRepo,
      apiError,
      liveApiCounts: {
        repositories: repositories.length,
        branches: branches.length,
        commits: commits.length,
        pullRequests: pullRequests.length,
        issues: issues.length,
      },
      dbSyncedEntities: {
        total: totalDbEntities,
        byType: dbEntitiesCount,
      },
      dataSamples: {
        repositoriesSample: repositories.slice(0, 2),
        branchesSample: branches.slice(0, 2),
        commitsSample: commits.slice(0, 2),
        pullRequestsSample: pullRequests.slice(0, 2),
        issuesSample: issues.slice(0, 2),
      },
    });
  } catch (error: unknown) {
    console.error("[Test Sync Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
