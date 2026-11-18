import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRepositories } from "@/lib/tools/get-repositories";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", authenticated: false },
        { status: 401 },
      );
    }

    // Fetch user from DB to verify corsairTenantId
    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id));

    if (!userRecord || !userRecord.corsairTenantId) {
      return NextResponse.json({
        authenticated: true,
        user: session.user,
        tenantProvisioned: false,
        message: "No corsairTenantId found on user row.",
      });
    }

    const tenantId = userRecord.corsairTenantId;
    const repos = await getRepositories({ userId: session.user.id, limit: 5 });

    return NextResponse.json({
      authenticated: true,
      tenantProvisioned: true,
      corsairTenantId: tenantId,
      githubReachable: repos.success,
      githubError: repos.success ? null : repos.error,
      reposSample: repos.repositories.map((r) => r.fullName),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
