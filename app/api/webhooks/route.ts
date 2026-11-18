import { createHmac, timingSafeEqual } from "node:crypto";
import { processWebhook } from "corsair";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { inngest } from "@/inngest";
import { corsair } from "@/server/corsair";

export const runtime = "nodejs";

function hasValidSignature(rawBody: string, signature: string | null) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature?.startsWith("sha256=")) return false;

  const expected = Buffer.from(
    `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`,
  );
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function repositoryFrom(body: unknown) {
  const repo = (body as { repository?: { name?: string; owner?: { login?: string } } })
    ?.repository;
  return {
    repositoryOwner: repo?.owner?.login ?? "",
    repositoryName: repo?.name ?? "",
  };
}

export async function POST(req: Request) {
  const tenantId = new URL(req.url).searchParams.get("tenantId");
  if (!tenantId) {
    return Response.json({ error: "Missing tenantId." }, { status: 400 });
  }

  const [owner] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.corsairTenantId, tenantId))
    .limit(1);
  if (!owner) {
    return Response.json({ error: "Unknown tenant." }, { status: 404 });
  }

  const rawBody = await req.text();
  if (!hasValidSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: unknown = rawBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const headers = Object.fromEntries(req.headers.entries());

  try {
    const result = await processWebhook(
      corsair,
      headers,
      body as Record<string, unknown>,
      { tenantId },
    );
    const handled =
      Boolean(result.plugin) &&
      (result.response as { success?: boolean } | undefined)?.success === true;

    if (handled) {
      await inngest.send({
        name: "github.webhook",
        data: { userId: owner.id, corsairTenantId: tenantId, ...repositoryFrom(body) },
      });
    }

    return Response.json(
      { success: handled, plugin: result.plugin, action: result.action },
      { status: handled ? 200 : 202, headers: result.responseHeaders },
    );
  } catch (error) {
    console.error("[webhooks] processing failed", error);
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
