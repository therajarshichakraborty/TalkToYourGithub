import { auth } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { streamText } from "ai";
import { headers } from "next/headers";
import {
  buildSystemPrompt,
  buildToolRegistry,
  chatModel,
} from "@/features/chat";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  /*
   * Destructure `messages` (CoreMessage[]) — the AI SDK data-stream protocol
   * expects an array; a single object will cause streamText to throw.
   */
  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "Request body must contain a non-empty `messages` array." },
      { status: 400 },
    );
  }

  /*
   * Single DB query: fetch the github_connections row to get the user's
   * GitHub login and connection timestamp for the system prompt.
   * The `user` row is not needed here — session.user already has what we need.
   */
  const [conn] = await db
    .select()
    .from(schema.githubConnections)
    .where(eq(schema.githubConnections.userId, session.user.id));

  const systemPrompt = buildSystemPrompt({
    githubLogin: conn?.githubLogin ?? session.user.name ?? "unknown",
    connectedAt: conn?.connectedAt?.toISOString(),
  });

  /*
   * buildToolRegistry binds the authenticated userId to every tool execute()
   * call — this is the tenant-scoping gate. Tools resolve corsairTenantId from
   * the userId before touching any Corsair data.
   */
  const tools = buildToolRegistry({ userId: session.user.id });

  try {
    const result = streamText({
      model: chatModel,
      system: systemPrompt,
      messages,
      tools,
      /*
       * maxSteps > 1 is required for tool calls to actually execute.
       * Without it the SDK emits the tool-call token but never loops back
       * to run the tool and stream the result to the client.
       * 5 steps covers: user → tool-call → tool-result → follow-up tool (if needed) → final answer.
       */
      maxSteps: 5,
      onError: (err) => {
        console.error("[/api/chat] streamText error:", err);
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/chat] Unhandled error:", message);
    return Response.json(
      { error: "Chat request failed. Check server logs for details." },
      { status: 500 },
    );
  }
}