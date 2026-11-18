import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { inngest } from "@/inngest";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    owner?: string;
    name?: string;
  };
  const scoped = Boolean(body.owner && body.name);

  const [user] = await db
    .select({ corsairTenantId: schema.user.corsairTenantId })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  try {
    await inngest.send({
      name: "github.connected",
      data: {
        userId: session.user.id,
        corsairTenantId: user?.corsairTenantId ?? undefined,
        repositoryOwner: scoped ? body.owner! : "",
        repositoryName: scoped ? body.name! : "",
      },
    });
    return Response.json({
      success: true,
      scope: scoped ? `${body.owner}/${body.name}` : "recent repositories",
    });
  } catch (error) {
    console.error("[inngest/trigger] send failed", error);
    return Response.json(
      { error: "Could not queue the sync job." },
      { status: 500 },
    );
  }
}
