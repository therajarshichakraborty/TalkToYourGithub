import { streamText, type CoreMessage } from "ai";
import { and, desc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import {
  buildSystemPrompt,
  buildToolRegistry,
  chatModel,
  type ActiveRepo,
} from "@/features/chat";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const HISTORY_WINDOW = 8;
const MAX_MESSAGE_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 700;
const MAX_TOOL_STEPS = 6;

interface IncomingMessage {
  role: string;
  content: unknown;
}

function toModelMessages(messages: IncomingMessage[]): CoreMessage[] {
  return messages
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
}

function parseActiveRepo(value: unknown): ActiveRepo | null {
  if (!value || typeof value !== "object") return null;
  const { owner, name } = value as Record<string, unknown>;
  return typeof owner === "string" && typeof name === "string" && owner && name
    ? { owner, name }
    : null;
}

async function resolveConversation(userId: string, repo: ActiveRepo | null) {
  const [existing] = await db
    .select({ id: schema.conversations.id })
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.userId, userId),
        repo
          ? eq(schema.conversations.repositoryOwner, repo.owner)
          : isNull(schema.conversations.repositoryOwner),
        repo
          ? eq(schema.conversations.repositoryName, repo.name)
          : isNull(schema.conversations.repositoryName),
      ),
    )
    .orderBy(desc(schema.conversations.updatedAt))
    .limit(1);

  if (existing) {
    await db
      .update(schema.conversations)
      .set({ updatedAt: new Date() })
      .where(eq(schema.conversations.id, existing.id));
    return existing.id;
  }

  const [created] = await db
    .insert(schema.conversations)
    .values({
      userId,
      repositoryOwner: repo?.owner ?? null,
      repositoryName: repo?.name ?? null,
      title: repo ? repo.name : "General",
    })
    .returning({ id: schema.conversations.id });
  return created.id;
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = (await req.json().catch(() => null)) as {
    messages?: IncomingMessage[];
    activeRepo?: unknown;
  } | null;

  const messages = toModelMessages(body?.messages ?? []);
  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role !== "user") {
    return Response.json(
      { error: "A user message is required." },
      { status: 400 },
    );
  }

  const activeRepo = parseActiveRepo(body?.activeRepo);
  const userText = lastMessage.content as string;

  const [connection] = await db
    .select({ githubLogin: schema.githubConnections.githubLogin })
    .from(schema.githubConnections)
    .where(eq(schema.githubConnections.userId, userId))
    .orderBy(desc(schema.githubConnections.connectedAt))
    .limit(1);

  let conversationId: string | null = null;
  try {
    conversationId = await resolveConversation(userId, activeRepo);
    await db
      .insert(schema.messages)
      .values({ conversationId, role: "user", content: userText });

    if (activeRepo) {
      await db.insert(schema.activityLogs).values({
        userId,
        repositoryOwner: activeRepo.owner,
        repositoryName: activeRepo.name,
        activityType: "chat",
        title: userText.slice(0, 80),
        occurredAt: new Date(),
      });
    }
  } catch (error) {
    console.error("[chat] persistence failed", error);
  }

  const result = streamText({
    model: chatModel,
    system: buildSystemPrompt({
      githubLogin: connection?.githubLogin ?? session.user.name,
      activeRepo,
    }),
    messages,
    tools: buildToolRegistry({ userId, activeRepo }),
    maxSteps: MAX_TOOL_STEPS,
    maxTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.3,
    onFinish: async ({ text, steps }) => {
      if (!conversationId) return;
      const toolCalls = steps.flatMap((step) =>
        step.toolResults.map((r) => ({
          toolCallId: r.toolCallId,
          toolName: r.toolName,
          args: r.args,
          result: r.result,
          state: "result",
        })),
      );
      if (!text && toolCalls.length === 0) return;
      await db
        .insert(schema.messages)
        .values({
          conversationId,
          role: "assistant",
          content: text,
          toolCalls: toolCalls.length ? toolCalls : null,
        })
        .catch((error) => console.error("[chat] save reply failed", error));
    },
    onError: ({ error }) => console.error("[chat] stream failed", error),
  });

  return result.toDataStreamResponse({
    getErrorMessage: () => "The assistant hit an error. Please try again.",
  });
}
