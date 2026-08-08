import { auth } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

  const userId = session.user.id;

  /*
   * Destructure `messages` (CoreMessage[]) and optional `activeRepo` context object.
   */
  const { messages, activeRepo } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "Request body must contain a non-empty `messages` array." },
      { status: 400 },
    );
  }

  const repoOwner = activeRepo?.owner || null;
  const repoName = activeRepo?.name || null;

  /*
   * Single DB query: fetch github_connections row
   */
  const [conn] = await db
    .select()
    .from(schema.githubConnections)
    .where(eq(schema.githubConnections.userId, userId));

  const systemPrompt = buildSystemPrompt({
    githubLogin: conn?.githubLogin ?? session.user.name ?? "unknown",
    connectedAt: conn?.connectedAt?.toISOString(),
    activeRepo:
      repoOwner && repoName ? { owner: repoOwner, name: repoName } : null,
  });

  const tools = buildToolRegistry({ userId });

  /*
   * 1. Find or create conversation in DB for persistence
   */
  let conversationId: string | null = null;
  try {
    let existingConv;
    if (repoOwner && repoName) {
      const [conv] = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.userId, userId),
            eq(schema.conversations.repositoryOwner, repoOwner),
            eq(schema.conversations.repositoryName, repoName),
          ),
        )
        .limit(1);
      existingConv = conv;
    }

    if (existingConv) {
      conversationId = existingConv.id;
      await db
        .update(schema.conversations)
        .set({ updatedAt: new Date() })
        .where(eq(schema.conversations.id, conversationId));
    } else {
      const [newConv] = await db
        .insert(schema.conversations)
        .values({
          userId,
          repositoryOwner: repoOwner,
          repositoryName: repoName,
          title: repoName ? `Chat: ${repoName}` : "General Chat",
          updatedAt: new Date(),
        })
        .returning({ id: schema.conversations.id });
      conversationId = newConv.id;
    }

    /*
     * 2. Save latest user message into DB messages table
     */
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === "user" && conversationId) {
      const userText =
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage.content);

      await db.insert(schema.messages).values({
        conversationId,
        role: "user",
        content: userText,
      });

      /*
       * 3. Insert Activity Log row for this repository so chat moves repo to top on dashboard
       */
      if (repoOwner && repoName) {
        await db
          .insert(schema.activityLogs)
          .values({
            userId,
            repositoryOwner: repoOwner,
            repositoryName: repoName,
            activityType: "chat",
            activityId: `chat_${userId}_${repoOwner}_${repoName}_${Date.now()}`,
            title: `Chatted with AI Assistant: "${userText.slice(0, 60)}${userText.length > 60 ? "..." : ""}"`,
            description: `Repository chat query in ${repoOwner}/${repoName}`,
            metadata: { repo: `${repoOwner}/${repoName}` },
            occurredAt: new Date(),
          })
          .catch((logErr) =>
            console.warn("[/api/chat] Note writing activity log:", logErr),
          );
      }
    }
  } catch (dbErr) {
    console.warn("[/api/chat] Conversation persistence note:", dbErr);
  }

  try {
    const result = streamText({
      model: chatModel,
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 5,
      onFinish: async ({ text, toolInvocations }) => {
        if (conversationId && text) {
          await db
            .insert(schema.messages)
            .values({
              conversationId,
              role: "assistant",
              content: text,
              toolCalls: toolInvocations
                ? JSON.parse(JSON.stringify(toolInvocations))
                : null,
            })
            .catch((err) =>
              console.warn("[/api/chat] Error saving assistant message:", err),
            );
        }
      },
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
