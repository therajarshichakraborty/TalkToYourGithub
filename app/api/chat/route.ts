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
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { message } = await req.json();

    const [user] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, session.user.id))

    const [conn] = await db
        .select()
        .from(schema.githubConnections)
        .where(eq(schema.githubConnections.userId, session.user.id));

    const systemPrompt = buildSystemPrompt({
        githubLogin: conn?.githubLogin ?? session.user.name ?? "unknown",

        connectedAt: conn?.createdAt?.toISOString()
    })

    const tools = buildToolRegistry({
        userId: session.user.id
    });

    const result = streamText({
        model: chatModel,
        system: systemPrompt,
        messages: message,
        tools: tools,
    });

    return result.toDataStreamResponse();
}