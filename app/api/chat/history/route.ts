import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const HISTORY_LIMIT = 50;

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const name = searchParams.get("name");
  const scoped = Boolean(owner && name);

  try {
    const [conversation] = await db
      .select({ id: schema.conversations.id })
      .from(schema.conversations)
      .where(
        and(
          eq(schema.conversations.userId, session.user.id),
          scoped
            ? eq(schema.conversations.repositoryOwner, owner!)
            : isNull(schema.conversations.repositoryOwner),
          scoped
            ? eq(schema.conversations.repositoryName, name!)
            : isNull(schema.conversations.repositoryName),
        ),
      )
      .orderBy(desc(schema.conversations.updatedAt))
      .limit(1);

    if (!conversation) {
      return Response.json({ success: true, messages: [] });
    }

    const rows = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversation.id))
      .orderBy(desc(schema.messages.createdAt))
      .limit(HISTORY_LIMIT);

    const messages = rows.reverse().map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolInvocations: Array.isArray(m.toolCalls) ? m.toolCalls : undefined,
      createdAt: m.createdAt,
    }));

    return Response.json({ success: true, messages });
  } catch (error) {
    console.error("[chat/history] load failed", error);
    return Response.json(
      { error: "Failed to load chat history." },
      { status: 500 },
    );
  }
}
