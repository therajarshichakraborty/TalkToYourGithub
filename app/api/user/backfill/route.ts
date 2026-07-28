import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { corsair } from "@/server/corsair";
import { setupCorsair } from "corsair";
import { pool } from "@/lib/pool";

export async function POST() {
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

    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id));

    if (!userRecord || !userRecord.corsairTenantId) {
      return NextResponse.json(
        { error: "No corsairTenantId found for user. Please authenticate via GitHub first." },
        { status: 400 }
      );
    }

    const tenantId = userRecord.corsairTenantId;

    // Trigger Corsair setup with backfill enabled for this tenant
    const setupOutput = await setupCorsair(corsair, {
      tenantId,
      backfill: true,
    });

    // Check count of populated entities in corsair_entities for this tenant
    const res = await pool.query(
      `SELECT entity_type, COUNT(*)::int as count FROM corsair_entities WHERE account_id IN (SELECT id FROM corsair_accounts WHERE tenant_id = $1) GROUP BY entity_type`,
      [tenantId]
    );

    return NextResponse.json({
      success: true,
      tenantId,
      setupOutput,
      entityCounts: res.rows,
    });
  } catch (error: unknown) {
    console.error("[Backfill Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const [userRecord] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id));

    if (!userRecord || !userRecord.corsairTenantId) {
      return NextResponse.json({
        authenticated: true,
        tenantProvisioned: false,
        entityCounts: [],
      });
    }

    const res = await pool.query(
      `SELECT entity_type, COUNT(*)::int as count FROM corsair_entities WHERE account_id IN (SELECT id FROM corsair_accounts WHERE tenant_id = $1) GROUP BY entity_type`,
      [userRecord.corsairTenantId]
    );

    return NextResponse.json({
      authenticated: true,
      tenantProvisioned: true,
      tenantId: userRecord.corsairTenantId,
      entityCounts: res.rows,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
