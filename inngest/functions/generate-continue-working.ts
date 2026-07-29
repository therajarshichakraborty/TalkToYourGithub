import { inngest } from "../client";
import { getCommits } from "@/lib/tools/get-commits";
import { generateText } from "ai";
import { chatModel } from "@/features/chat";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Inngest function: generateContinueWorking
 * Reads recent developer activity logs from activityLogs database table and uses LLM text synthesis
 * to construct a Continue Working summary card for the developer dashboard.
 */
export const generateContinueWorking = inngest.createFunction(
  {
    id: "generate-continue-working",
    name: "Generate Continue Working Dashboard Summary",
  },
  [{ event: "activity.continue_working" }, { event: "github.connected" }],
  async ({ event, step }) => {
    const { corsairTenantId, repositoryOwner, repositoryName } = event.data;
    let userId = event.data.userId;

    // Resolve userId if needed
    if (!userId && corsairTenantId) {
      const [foundUser] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.corsairTenantId, corsairTenantId))
        .limit(1);
      if (foundUser) {
        userId = foundUser.id;
      }
    }

    if (!userId) {
      const [defaultUser] = await db.select().from(schema.user).limit(1);
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    if (!userId) {
      throw new Error(
        "[generateContinueWorking] Cannot generate summary: missing userId.",
      );
    }

    /**
     * Step 1: Read recent developer activity logs from database.
     */
    const recentLogs = await step.run("fetch-recent-activities", async () => {
      const logs = await db
        .select()
        .from(schema.activityLogs)
        .where(eq(schema.activityLogs.userId, userId))
        .orderBy(desc(schema.activityLogs.occurredAt))
        .limit(15);

      if (logs.length > 0) {
        return logs.map((l) => ({
          repo: `${l.repositoryOwner}/${l.repositoryName}`,
          type: l.activityType,
          title: l.title,
          description: l.description,
          occurredAt: l.occurredAt?.toISOString() || String(l.occurredAt),
        }));
      }

      // Fallback: Fetch recent commits via Live API if DB activityLogs is empty
      if (repositoryOwner && repositoryName) {
        try {
          const commitsRes = await getCommits({
            userId,
            tenantId: corsairTenantId,
            owner: repositoryOwner,
            repo: repositoryName,
            perPage: 10,
          });
          if (commitsRes.success && commitsRes.commits?.length) {
            return commitsRes.commits.map((c: any) => ({
              repo: `${repositoryOwner}/${repositoryName}`,
              type: "commit",
              title: c.commit?.message || "Commit",
              description: c.sha || "",
              occurredAt: c.commit?.author?.date || new Date().toISOString(),
            }));
          }
        } catch (e) {
          console.warn("[generateContinueWorking] Fallback commit fetch note:", e);
        }
      }

      return [];
    });

    if (!recentLogs.length) {
      return {
        success: true,
        message: "No recent activity logs available to summarize.",
      };
    }

    /**
     * Step 2: Synthesize Continue Working summary via AI text generation.
     */
    const summaryText = await step.run(
      "synthesize-continue-working-summary",
      async () => {
        const activityListStr = recentLogs
          .map(
            (a) =>
              `* [${a.repo}] (${a.type}): ${a.title} - ${a.description} (${a.occurredAt})`,
          )
          .join("\n");

        const prompt = `
You are an AI developer productivity assistant. Analyze the following recent GitHub developer activity log and compose a clear, concise "Continue Working" summary card (2 paragraphs):

Paragraph 1: State what the developer was working on recently across their repositories (recent commits, PRs, or open issues).
Paragraph 2: Recommend the immediate next logical task or action items they should focus on when returning to work.

Recent Activity Log:
${activityListStr}
`;

        const { text } = await generateText({
          model: chatModel,
          prompt,
        });

        return text;
      },
    );

    /**
     * Step 3: Persist Continue Working summary into activityLogs table.
     */
    await step.run("store-continue-working-summary", async () => {
      const activityId = `continue_working_summary_${userId}`;

      await db
        .delete(schema.activityLogs)
        .where(
          and(
            eq(schema.activityLogs.userId, userId),
            eq(schema.activityLogs.activityId, activityId),
          ),
        )
        .catch(() => {
          // Ignore delete error if record does not exist
        });

      await db.insert(schema.activityLogs).values({
        userId,
        repositoryOwner: repositoryOwner || "all",
        repositoryName: repositoryName || "all",
        activityType: "review",
        activityId,
        title: "Continue Working Dashboard Summary",
        description: summaryText,
        metadata: {
          generatedAt: new Date().toISOString(),
          logCount: recentLogs.length,
        },
        occurredAt: new Date(),
      });
    });

    return {
      success: true,
      summary: summaryText,
    };
  },
);
