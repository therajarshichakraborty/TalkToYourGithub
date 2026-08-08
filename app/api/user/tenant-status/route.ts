import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { corsair } from "@/server/corsair";

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

    // Test querying Corsair via withTenant(userRecord.corsairTenantId)
    const tenantId = userRecord.corsairTenantId;
    const tenant = corsair.withTenant(tenantId) as any;

    let repos: unknown = [];
    let corsairSuccess = false;
    let corsairError: string | null = null;

    try {
      repos = await (tenant as any).github?.api?.repositories?.list({
        perPage: 5,
      });
      corsairSuccess = true;
    } catch (err: unknown) {
      corsairError = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({
      authenticated: true,
      tenantProvisioned: true,
      corsairTenantId: tenantId,
      corsairSuccess,
      corsairError,
      reposSample: repos,
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
