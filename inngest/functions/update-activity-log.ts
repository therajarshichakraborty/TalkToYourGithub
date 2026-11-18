import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getCommits } from "@/lib/tools/get-commits";
import { getIssues } from "@/lib/tools/get-issues";
import { getPullRequests } from "@/lib/tools/get-pull-requests";
import { getRepositories } from "@/lib/tools/get-repositories";
import { inngest } from "../client";
import { resolveEventUser, SYNC_DEBOUNCE } from "../resolve-user";

const MAX_REPOS_PER_RUN = 10;
const ITEMS_PER_KIND = 10;

interface ActivityItem {
  repositoryOwner: string;
  repositoryName: string;
  activityType: "commit" | "pr" | "issue";
  activityId: string;
  title: string;
  description: string;
  metadata: Record<string, string | number>;
  occurredAt: string;
}

async function collectActivity(
  userId: string,
  owner: string,
  name: string,
): Promise<ActivityItem[]> {
  const target = { userId, owner, repo: name, perPage: ITEMS_PER_KIND };
  const [commits, pulls, issues] = await Promise.all([
    getCommits(target),
    getPullRequests({ ...target, state: "all" }),
    getIssues({ ...target, state: "all" }),
  ]);
  const base = { repositoryOwner: owner, repositoryName: name };

  return [
    ...commits.commits.map((c) => ({
      ...base,
      activityType: "commit" as const,
      activityId: `commit_${owner}_${name}_${c.sha}`,
      title: c.message,
      description: `${c.sha} by ${c.author}`,
      metadata: { sha: c.sha, author: c.author },
      occurredAt: c.date || new Date().toISOString(),
    })),
    ...pulls.pullRequests.map((pr) => ({
      ...base,
      activityType: "pr" as const,
      activityId: `pr_${owner}_${name}_${pr.number}`,
      title: `#${pr.number} ${pr.title}`,
      description: `${pr.merged ? "merged" : pr.state} by ${pr.author}`,
      metadata: { number: pr.number, state: pr.state, url: pr.url },
      occurredAt: pr.updatedAt,
    })),
    ...issues.issues.map((issue) => ({
      ...base,
      activityType: "issue" as const,
      activityId: `issue_${owner}_${name}_${issue.number}`,
      title: `#${issue.number} ${issue.title}`,
      description: `${issue.state} by ${issue.author}`,
      metadata: { number: issue.number, state: issue.state, url: issue.url },
      occurredAt: issue.updatedAt,
    })),
  ];
}

export const updateActivityLog = inngest.createFunction(
  {
    id: "update-activity-log",
    name: "Update Developer Activity Log",
    debounce: SYNC_DEBOUNCE,
  },
  [
    { event: "github.connected" },
    { event: "github.webhook" },
    { event: "activity.update" },
  ],
  async ({ event, step }) => {
    const { repositoryOwner, repositoryName } = event.data;
    const { userId, corsairTenantId } = await step.run("resolve-user", () =>
      resolveEventUser(event.data),
    );

    const targets = await step.run("select-repositories", async () => {
      if (repositoryOwner && repositoryName) {
        return [{ owner: repositoryOwner, name: repositoryName }];
      }
      const result = await getRepositories({ userId, limit: MAX_REPOS_PER_RUN });
      return result.repositories.map((r) => ({ owner: r.owner, name: r.name }));
    });

    let written = 0;

    for (const repo of targets) {
      written += await step.run(`sync-${repo.owner}/${repo.name}`, async () => {
        const items = await collectActivity(userId, repo.owner, repo.name);
        if (!items.length) return 0;

        await db.delete(schema.activityLogs).where(
          and(
            eq(schema.activityLogs.userId, userId),
            inArray(
              schema.activityLogs.activityId,
              items.map((i) => i.activityId),
            ),
          ),
        );
        await db.insert(schema.activityLogs).values(
          items.map((item) => ({
            ...item,
            userId,
            occurredAt: new Date(item.occurredAt),
          })),
        );
        return items.length;
      });
    }

    if (targets.length) {
      await step.sendEvent(
        "trigger-continue-working",
        targets.map((repo) => ({
          name: "activity.continue_working" as const,
          data: {
            userId,
            corsairTenantId,
            repositoryOwner: repo.owner,
            repositoryName: repo.name,
          },
        })),
      );
    }

    return { written };
  },
);
