import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getRepositories,
  getBranches,
  getCommits,
  getPullRequests,
  getIssues,
} from "@/lib/tools";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tool = searchParams.get("tool") || "repositories";
    const overrideTenantId = searchParams.get("tenantId") || undefined;
    const owner = searchParams.get("owner") || undefined;
    const repo = searchParams.get("repo") || undefined;
    const perPage = searchParams.get("perPage") ? parseInt(searchParams.get("perPage")!, 10) : undefined;
    const state = (searchParams.get("state") as "open" | "closed" | "all") || "all";

    let tenantId = overrideTenantId;

    if (!tenantId) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (session?.user?.id) {
        const [userRecord] = await db
          .select()
          .from(schema.user)
          .where(eq(schema.user.id, session.user.id));
        tenantId = userRecord?.corsairTenantId || undefined;
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        {
          error: "Unauthorized or missing tenant ID.",
          message: "Please log in via GitHub OAuth or provide a 'tenantId' query parameter in browser / RequestKit.",
        },
        { status: 400 }
      );
    }

    switch (tool) {
      case "repositories":
      case "repos": {
        const result = await getRepositories({ tenantId, perPage });
        return NextResponse.json({ tool, ...result });
      }

      case "branches": {
        if (!owner || !repo) {
          return NextResponse.json(
            { error: "Query parameters 'owner' and 'repo' are required for 'branches' tool." },
            { status: 400 }
          );
        }
        const result = await getBranches({ owner, repo, tenantId });
        return NextResponse.json({ tool, ...result });
      }

      case "commits": {
        if (!owner || !repo) {
          return NextResponse.json(
            { error: "Query parameters 'owner' and 'repo' are required for 'commits' tool." },
            { status: 400 }
          );
        }
        const result = await getCommits({ owner, repo, perPage, tenantId });
        return NextResponse.json({ tool, ...result });
      }

      case "prs":
      case "pull-requests": {
        if (!owner || !repo) {
          return NextResponse.json(
            { error: "Query parameters 'owner' and 'repo' are required for 'prs' tool." },
            { status: 400 }
          );
        }
        const result = await getPullRequests({ owner, repo, state, perPage, tenantId });
        return NextResponse.json({ tool, ...result });
      }

      case "issues": {
        if (!owner || !repo) {
          return NextResponse.json(
            { error: "Query parameters 'owner' and 'repo' are required for 'issues' tool." },
            { status: 400 }
          );
        }
        const result = await getIssues({ owner, repo, state, perPage, tenantId });
        return NextResponse.json({ tool, ...result });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown tool '${tool}'. Available tools: repositories, branches, commits, prs, issues.`,
          },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
