import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getRepositories } from "@/lib/tools/get-repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = new URL(req.url).searchParams.get("refresh") === "1";
  const result = await getRepositories({ userId: session.user.id, force });

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  return Response.json(
    { success: true, count: result.count, repositories: result.repositories },
    { headers: { "Cache-Control": "no-store" } },
  );
}
