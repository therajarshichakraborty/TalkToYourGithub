import { inngest } from "../client";
import { getCorsairTenantClient } from "@/lib/tools/helper";
import { getRepositories } from "@/lib/tools/get-repositories";
import { getCommits } from "@/lib/tools/get-commits";
import { getPullRequests } from "@/lib/tools/get-pull-requests";
import { getIssues } from "@/lib/tools/get-issues";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Interface representing a formatted activity log record to insert into activityLogs table.
 */
export interface FormatActivityItem {
  userId: string;
  repositoryOwner: string;
  repositoryName: string;
  activityType: "commit" | "pr" | "issue" | "review";
  activityId: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

/**
 * Inngest function: updateActivityLog
 * Listens to GitHub webhook and sync events, extracts commits, pull requests, and issues,
 * and writes structured records into the activityLogs database table.
 */
export const updateActivityLog = inngest.createFunction(
  {
    id: "update-activity-log",
    name: "Update Developer Activity Log",
  },
  [
    { event: "github.connected" },
    { event: "github.webhook" },
    { event: "activity.update" },
  ],
  async ({ event, step }) => {
    let { userId, corsairTenantId, repositoryOwner, repositoryName } =
      event.data;

    // Resolve userId if not provided directly
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
        corsairTenantId = defaultUser.corsairTenantId || undefined;
      }
    }

    if (!userId) {
      throw new Error(
        "[updateActivityLog] Cannot update activity logs: no user found.",
      );
    }

    /**
     * Step 1: Gather and format developer activities from Corsair entities.
     */
    const activitiesToSave: FormatActivityItem[] = await step.run(
      "fetch-latest-activities",
      async () => {
        const items: FormatActivityItem[] = [];

        const { tenantId } = await getCorsairTenantClient({
          userId,
          tenantId: corsairTenantId,
        });

        const repoResult = await getRepositories({
          userId,
          tenantId,
          perPage: 10,
        });

        if (!repoResult.success || !repoResult.repositories?.length) {
          return items;
        }

        let targetRepos = repoResult.repositories.map((r) => {
          const full_name = r.full_name || r.fullName || "";
          const parts = full_name.split("/");
          return {
            owner: r.owner?.login || r.owner || parts[0] || "",
            name: r.name || parts[1] || "",
          };
        });

        if (repositoryOwner && repositoryName) {
          const targetOwner = repositoryOwner.toLowerCase();
          const targetName = repositoryName.toLowerCase();
          targetRepos = targetRepos.filter(
            (r) =>
              r.owner.toLowerCase() === targetOwner &&
              r.name.toLowerCase() === targetName,
          );
        }

        for (const repo of targetRepos) {
          const { owner, name } = repo;
          if (!owner || !name) continue;

          const [commitsRes, prsRes, issuesRes] = await Promise.allSettled([
            getCommits({
              userId,
              tenantId: corsairTenantId,
              owner,
              repo: name,
              perPage: 10,
            }),
            getPullRequests({
              userId,
              tenantId: corsairTenantId,
              owner,
              repo: name,
              state: "all",
              perPage: 10,
            }),
            getIssues({
              userId,
              tenantId: corsairTenantId,
              owner,
              repo: name,
              state: "all",
              perPage: 10,
            }),
          ]);

          // Process commits
          if (commitsRes.status === "fulfilled" && commitsRes.value.success) {
            const commits = commitsRes.value.commits || [];
            for (const c of commits) {
              const sha = c.sha || c.id || "";
              const title = (c.commit?.message || c.message || "").split(
                "\n",
              )[0];
              const author =
                c.commit?.author?.name || c.author?.login || "Developer";
              const dateStr =
                c.commit?.author?.date || c.commit?.committer?.date;
              const occurredAt = (
                dateStr ? new Date(dateStr) : new Date()
              ).toISOString();

              if (title && sha) {
                items.push({
                  userId: userId!,
                  repositoryOwner: owner,
                  repositoryName: name,
                  activityType: "commit",
                  activityId: `commit_${owner}_${name}_${sha}`,
                  title: `Pushed commit: ${title}`,
                  description: `Commit ${sha.slice(0, 7)} by ${author}`,
                  metadata: {
                    sha,
                    author,
                    url: c.html_url || `https://github.com/${owner}/${name}/commit/${sha}`,
                  },
                  occurredAt,
                });
              }
            }
          }

          // Process PRs
          if (prsRes.status === "fulfilled" && prsRes.value.success) {
            const prs = prsRes.value.pullRequests || [];
            for (const pr of prs) {
              const number = pr.number || pr.id || "";
              const title = pr.title || "";
              const state = pr.state || "open";
              const author = pr.user?.login || "Developer";
              const dateStr = pr.created_at || pr.updated_at;
              const occurredAt = (
                dateStr ? new Date(dateStr) : new Date()
              ).toISOString();

              if (title && number) {
                items.push({
                  userId: userId!,
                  repositoryOwner: owner,
                  repositoryName: name,
                  activityType: "pr",
                  activityId: `pr_${owner}_${name}_${number}`,
                  title: `Pull Request #${number} (${state}): ${title}`,
                  description: `Opened/updated by ${author}`,
                  metadata: {
                    number,
                    state,
                    author,
                    url: pr.html_url || `https://github.com/${owner}/${name}/pull/${number}`,
                  },
                  occurredAt,
                });
              }
            }
          }

          // Process Issues
          if (issuesRes.status === "fulfilled" && issuesRes.value.success) {
            const issues = issuesRes.value.issues || [];
            for (const issue of issues) {
              const number = issue.number || issue.id || "";
              const title = issue.title || "";
              const state = issue.state || "open";
              const author = issue.user?.login || "Developer";
              const dateStr = issue.created_at || issue.updated_at;
              const occurredAt = (
                dateStr ? new Date(dateStr) : new Date()
              ).toISOString();

              if (title && number) {
                items.push({
                  userId: userId!,
                  repositoryOwner: owner,
                  repositoryName: name,
                  activityType: "issue",
                  activityId: `issue_${owner}_${name}_${number}`,
                  title: `Issue #${number} (${state}): ${title}`,
                  description: `Reported/updated by ${author}`,
                  metadata: {
                    number,
                    state,
                    author,
                    url: issue.html_url || `https://github.com/${owner}/${name}/issues/${number}`,
                  },
                  occurredAt,
                });
              }
            }
          }
        }

        return items;
      },
    );

    if (!activitiesToSave.length) {
      return {
        success: true,
        message: "No new activity log entries to save.",
        insertedCount: 0,
      };
    }

    /**
     * Step 2: Persist activity logs into database table.
     */
    const insertedCount = await step.run(
      "write-activity-logs",
      async () => {
        let count = 0;
        for (const item of activitiesToSave) {
          // Remove existing record with same activityId to update
          await db
            .delete(schema.activityLogs)
            .where(
              and(
                eq(schema.activityLogs.userId, item.userId),
                eq(schema.activityLogs.activityId, item.activityId),
              ),
            )
            .catch(() => {
              // Ignore if record does not exist
            });

          await db.insert(schema.activityLogs).values({
            userId: item.userId,
            repositoryOwner: item.repositoryOwner,
            repositoryName: item.repositoryName,
            activityType: item.activityType,
            activityId: item.activityId,
            title: item.title,
            description: item.description,
            metadata: item.metadata,
            occurredAt: new Date(item.occurredAt),
          });
          count++;
        }
        return count;
      },
    );

    /**
     * Step 3: Send trigger to generate Continue Working summary dashboard card.
     */
    await step.run("trigger-continue-working", async () => {
      await inngest.send({
        name: "activity.continue_working",
        data: {
          userId: userId!,
          corsairTenantId,
          repositoryOwner,
          repositoryName,
        },
      });
    });

    return {
      success: true,
      message: `Successfully written ${insertedCount} activity log entries.`,
      insertedCount,
    };
  },
);
