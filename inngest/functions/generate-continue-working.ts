import { generateText } from "ai";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { chatModel } from "@/features/chat/openai";
import { inngest } from "../client";
import { resolveEventUser, SYNC_DEBOUNCE } from "../resolve-user";

const SYSTEM_PROMPT =
  "Write a 'continue working' note for one repository from its activity log. Two short plain-prose paragraphs, max 90 words: (1) what changed recently, grouped by theme; (2) the single most sensible next step. Use only facts in the log. No headings, lists or preamble.";

export const generateContinueWorking = inngest.createFunction(
  {
    id: "generate-continue-working",
    name: "Generate Continue Working Summary",
    debounce: SYNC_DEBOUNCE,
  },
  { event: "activity.continue_working" },
  async ({ event, step }) => {
    const { repositoryOwner, repositoryName } = event.data;
    if (!repositoryOwner || !repositoryName) {
      return { skipped: "No repository specified." };
    }

    const { userId } = await step.run("resolve-user", () =>
      resolveEventUser(event.data),
    );
    const fullName = `${repositoryOwner}/${repositoryName}`;

    const logs = await step.run("load-activity", async () => {
      const conditions: SQL[] = [
        eq(schema.activityLogs.userId, userId),
        eq(sql`lower(${schema.activityLogs.repositoryOwner})`, repositoryOwner.toLowerCase()),
        eq(sql`lower(${schema.activityLogs.repositoryName})`, repositoryName.toLowerCase()),
      ];
      const rows = await db
        .select({
          type: schema.activityLogs.activityType,
          title: schema.activityLogs.title,
          occurredAt: schema.activityLogs.occurredAt,
        })
        .from(schema.activityLogs)
        .where(and(...conditions))
        .orderBy(desc(schema.activityLogs.occurredAt))
        .limit(15);
      return rows
        .filter((r) => r.type !== "review" && r.title)
        .map((r) => `${r.occurredAt.toISOString().slice(0, 10)} ${r.type}: ${r.title}`);
    });

    if (!logs.length) return { skipped: `No activity for ${fullName}.` };

    const summary = await step.run("summarize", async () => {
      const { text } = await generateText({
        model: chatModel,
        system: SYSTEM_PROMPT,
        prompt: `Repo: ${fullName}\n${logs.join("\n")}`,
        maxTokens: 180,
        temperature: 0.3,
      });
      return text.trim();
    });

    await step.run("save", async () => {
      const activityId = `continue_working_${userId}_${repositoryOwner}_${repositoryName}`;
      await db
        .delete(schema.activityLogs)
        .where(
          and(
            eq(schema.activityLogs.userId, userId),
            eq(schema.activityLogs.activityId, activityId),
          ),
        );
      await db.insert(schema.activityLogs).values({
        userId,
        repositoryOwner,
        repositoryName,
        activityType: "review",
        activityId,
        title: `Where you left off in ${repositoryName}`,
        description: summary,
        occurredAt: new Date(),
      });
    });

    return { repository: fullName, summary };
  },
);
