import { db } from "@/db";
import * as schema from "@/db/schema";
import { inngest } from "@/inngest";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

/**
 * GET /api/user/inngest-test
 * Lists all repository summaries in the database.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const debug = searchParams.get("debug");

    // Debug mode: show users + tenant info + OAuth scopes so you know what values to use
    if (debug === "true") {
      const users = await db.select().from(schema.user);
      const summaries = await db.select().from(schema.repositorySummaries);
      const activityLogs = await db.select().from(schema.activityLogs);
      const accounts = await db.select().from(schema.account);

      let tokenScopes = "Unknown";
      let ghUserLogin = "Unknown";

      if (accounts.length > 0 && accounts[0].accessToken) {
        try {
          const ghRes = await fetch("https://api.github.com/user", {
            headers: {
              Authorization: `Bearer ${accounts[0].accessToken}`,
              "User-Agent": "TalkToYourGithubApp",
            },
          });
          tokenScopes = ghRes.headers.get("x-oauth-scopes") || "None";
          if (ghRes.ok) {
            const ghData = await ghRes.json();
            ghUserLogin = ghData.login;
          }
        } catch (e) {
          tokenScopes = "Error checking token";
        }
      }

      const hasRepoScope = tokenScopes.includes("repo");

      return NextResponse.json({
        success: true,
        userCount: users.length,
        users: users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          corsairTenantId: u.corsairTenantId,
        })),
        githubAccount: {
          login: ghUserLogin,
          scopes: tokenScopes,
          hasPrivateRepoAccess: hasRepoScope,
        },
        summaryCount: summaries.length,
        activityLogCount: activityLogs.length,
        hint: !hasRepoScope
          ? "⚠️ Your GitHub token is missing 'repo' scope for private repositories! Please Sign Out and Sign In again at http://localhost:3000."
          : `✅ Token has full repo access. Use corsairTenantId "${users[0]?.corsairTenantId}" in your Inngest payload.`,
      });
    }

    let query = db.select().from(schema.repositorySummaries);
    if (userId) {
      query = query.where(eq(schema.repositorySummaries.userId, userId));
    }

    const summaries = await query;
    return NextResponse.json({
      success: true,
      count: summaries.length,
      summaries,
    });
  } catch (error: unknown) {
    console.error("[inngest-test GET Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/user/inngest-test
 * Triggers `github.connected` event for testing.
 * Body: { userId?: string, corsairTenantId?: string, repositoryOwner?: string, repositoryName?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, corsairTenantId, repositoryOwner, repositoryName } = body;

    // Find first user with tenant if not specified
    let targetUserId = userId;
    let targetTenantId = corsairTenantId;

    if (!targetUserId && !targetTenantId) {
      const [firstUser] = await db.select().from(schema.user).limit(1);
      if (firstUser) {
        targetUserId = firstUser.id;
        targetTenantId = firstUser.corsairTenantId || undefined;
      }
    }

    if (!targetUserId && !targetTenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid user or corsairTenantId found to trigger event.",
        },
        { status: 400 },
      );
    }

    const eventResult = await inngest.send({
      name: "github.connected",
      data: {
        userId: targetUserId,
        corsairTenantId: targetTenantId,
        repositoryOwner,
        repositoryName,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sent 'github.connected' event to Inngest.",
      eventId: eventResult.ids[0],
      payload: {
        userId: targetUserId,
        corsairTenantId: targetTenantId,
        repositoryOwner,
        repositoryName,
      },
    });
  } catch (error: unknown) {
    console.error("[inngest-test POST Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
