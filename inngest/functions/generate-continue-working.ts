import { inngest } from "../client";
import { getCommits } from "@/lib/tools/get-commits";
import { generateText } from "ai";
import { chatModel } from "@/features/chat";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, ilike } from "drizzle-orm";

/**
 * Inngest function: generateContinueWorking
 * Reads recent developer activity logs from activityLogs database table and uses LLM text synthesis
 * to construct a Continue Working summary card for a specific repository (or overall dashboard).
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
     * Step 1: Read recent developer activity logs from database for the specified repository.
     */
    const recentLogs = await step.run("fetch-recent-activities", async () => {
      const conditions = [eq(schema.activityLogs.userId, userId)];
      if (repositoryOwner) {
        conditions.push(
          ilike(schema.activityLogs.repositoryOwner, repositoryOwner),
        );
      }
      if (repositoryName) {
        conditions.push(
          ilike(schema.activityLogs.repositoryName, repositoryName),
        );
      }

      const logs = await db
        .select()
        .from(schema.activityLogs)
        .where(and(...conditions))
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

      // Fallback: Fetch recent commits via Live API if DB activityLogs is empty for this repository
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
            return commitsRes.commits.map((c) => ({
              repo: `${repositoryOwner}/${repositoryName}`,
              type: "commit",
              title: c.commit?.message || "Commit",
              description: c.sha || "",
              occurredAt: c.commit?.author?.date || new Date().toISOString(),
            }));
          }
        } catch (e) {
          console.warn(
            "[generateContinueWorking] Fallback commit fetch note:",
            e,
          );
        }
      }

      return [];
    });

    if (!recentLogs.length) {
      const targetName =
        repositoryOwner && repositoryName
          ? `${repositoryOwner}/${repositoryName}`
          : "the requested repository";
      return {
        success: true,
        message: `No recent activity logs available for ${targetName} to summarize.`,
      };
    }

    /**
     * Step 2: Synthesize repository-specific Continue Working summary via AI text generation.
     */
    const summaryText = await step.run(
      "synthesize-continue-working-summary",
      async () => {
        const targetRepoStr =
          repositoryOwner && repositoryName
            ? `${repositoryOwner}/${repositoryName}`
            : "the requested repository";

        const activityListStr = recentLogs
          .map(
            (a) =>
              `* [${a.repo}] (${a.type}): ${a.title} - ${a.description} (${a.occurredAt})`,
          )
          .join("\n");

        const prompt = `
You are an AI developer productivity assistant. Compose a clear, concise "Continue Working" summary card (2 paragraphs) focused specifically on repository "${targetRepoStr}":

Paragraph 1: Summarize recent development work (commits, PRs, issues) strictly for "${targetRepoStr}" based on the activity logs below. Do NOT mention any other repository.
Paragraph 2: Recommend the immediate next logical task, improvements, or action items specifically for "${targetRepoStr}".

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
     * Step 3: Persist Continue Working summary into activityLogs table for this repository.
     */
    await step.run("store-continue-working-summary", async () => {
      const repoKey =
        repositoryOwner && repositoryName
          ? `${repositoryOwner}_${repositoryName}`
          : "global";
      const activityId = `continue_working_summary_${userId}_${repoKey}`;

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
        title: repositoryName
          ? `Continue Working Summary: ${repositoryName}`
          : "Continue Working Dashboard Summary",
        description: summaryText,
        metadata: {
          generatedAt: new Date().toISOString(),
          logCount: recentLogs.length,
          targetRepo: repositoryName || "all",
        },
        occurredAt: new Date(),
      });
    });

    return {
      success: true,
      repository:
        repositoryOwner && repositoryName
          ? `${repositoryOwner}/${repositoryName}`
          : "all",
      summary: summaryText,
    };
  },
);
