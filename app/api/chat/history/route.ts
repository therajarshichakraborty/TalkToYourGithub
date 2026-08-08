/*
 * API route: /api/chat/history
 * Description: Fetches stored chat history messages for a specific user and repository context.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const name = searchParams.get("name");
  const userId = session.user.id;

  try {
    let conversation;

    if (owner && name) {
      const [conv] = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.userId, userId),
            eq(schema.conversations.repositoryOwner, owner),
            eq(schema.conversations.repositoryName, name),
          ),
        )
        .limit(1);
      conversation = conv;
    } else {
      const [conv] = await db
        .select()
        .from(schema.conversations)
        .where(and(eq(schema.conversations.userId, userId)))
        .orderBy(schema.conversations.updatedAt)
        .limit(1);
      conversation = conv;
    }

    if (!conversation) {
      return Response.json({ success: true, messages: [] });
    }

    const chatMessages = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversation.id))
      .orderBy(asc(schema.messages.createdAt));

    const formattedMessages = chatMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolInvocations: m.toolCalls || undefined,
      createdAt: m.createdAt,
    }));

    return Response.json({
      success: true,
      conversationId: conversation.id,
      messages: formattedMessages,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/chat/history] Error fetching history:", message);

    return Response.json(
      { error: "Failed to load chat history." },
      { status: 500 },
    );
  }
}
