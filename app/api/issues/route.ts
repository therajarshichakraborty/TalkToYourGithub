import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createIssue } from "@/lib/tools/create-issue";

export const runtime = "nodejs";

const bodySchema = z.object({
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(256),
  body: z.string().max(20000).default(""),
  labels: z.array(z.string().max(50)).max(10).default([]),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid issue." }, { status: 400 });
  }

  const result = await createIssue({ userId: session.user.id, ...parsed.data });
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 502 });
  }
  return Response.json(result);
}
