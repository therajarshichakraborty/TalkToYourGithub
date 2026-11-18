import { tool } from "ai";
import { z } from "zod";
import { getBranches } from "@/lib/tools/get-branches";
import { getCommits } from "@/lib/tools/get-commits";
import { getFileContent } from "@/lib/tools/get-file-content";
import { getIssues } from "@/lib/tools/get-issues";
import { getProjectMemory } from "@/lib/tools/get-project-memory";
import { getPullRequests } from "@/lib/tools/get-pull-requests";
import { getRepositories } from "@/lib/tools/get-repositories";
import { getRepositorySummary } from "@/lib/tools/get-repository-summary";
import { repoPath } from "@/lib/github/client";
import { reviewPullRequest } from "@/lib/tools/review-pull-request";
import type { ActiveRepo } from "./system-prompt";

export interface ToolRegistryContext {
  userId: string;
  activeRepo?: ActiveRepo | null;
}

const repoParams = {
  owner: z.string().optional().describe("Defaults to active repo owner"),
  repo: z.string().optional().describe("Defaults to active repo name"),
};

const MISSING_REPO = "Repository not specified. Ask the user which repo.";

const stateParam = z.enum(["open", "closed", "all"]).default("open");

export function buildToolRegistry({ userId, activeRepo }: ToolRegistryContext) {
  const withRepo = async <T>(
    owner: string | undefined,
    repo: string | undefined,
    run: (target: { owner: string; repo: string }) => Promise<T>,
  ) => {
    const target =
      owner && repo
        ? { owner, repo }
        : !owner && repo && activeRepo
          ? { owner: activeRepo.owner, repo }
          : !owner && !repo && activeRepo
            ? { owner: activeRepo.owner, repo: activeRepo.name }
            : null;
    if (!target) {
      return { success: false as const, error: MISSING_REPO };
    }
    return run(target);
  };

  return {
    getRepositories: tool({
      description: "List the user's repositories, most recently pushed first.",
      parameters: z.object({
        query: z.string().optional().describe("Filter by name substring"),
        limit: z.number().int().min(1).max(100).default(20),
      }),
      execute: async ({ query, limit }) => {
        const result = await getRepositories({ userId });
        if (!result.success) return result;
        const q = query?.toLowerCase();
        const repos = result.repositories
          .filter((r) => !q || r.fullName.toLowerCase().includes(q))
          .slice(0, limit)
          .map((r) => ({
            repo: r.fullName,
            lang: r.language,
            private: r.isPrivate,
            stars: r.stars,
            pushed: r.pushedAt?.slice(0, 10),
          }));
        return { success: true, total: result.count, repos };
      },
    }),

    getBranches: tool({
      description: "List branch names.",
      parameters: z.object(repoParams),
      execute: async ({ owner, repo }) =>
        withRepo(owner, repo, (t) =>
          getBranches({ userId, ...t, perPage: 50 }),
        ),
    }),

    getCommits: tool({
      description: "Recent commits (sha, message, author, date).",
      parameters: z.object({
        ...repoParams,
        branch: z.string().optional(),
        limit: z.number().int().min(1).max(30).default(10),
      }),
      execute: async ({ owner, repo, branch, limit }) =>
        withRepo(owner, repo, (t) =>
          getCommits({ userId, ...t, branch, perPage: limit }),
        ),
    }),

    getPullRequests: tool({
      description: "List pull requests.",
      parameters: z.object({
        ...repoParams,
        state: stateParam,
        limit: z.number().int().min(1).max(30).default(10),
      }),
      execute: async ({ owner, repo, state, limit }) =>
        withRepo(owner, repo, (t) =>
          getPullRequests({ userId, ...t, state, perPage: limit }),
        ),
    }),

    getIssues: tool({
      description: "List issues (excludes PRs).",
      parameters: z.object({
        ...repoParams,
        state: stateParam,
        limit: z.number().int().min(1).max(30).default(10),
      }),
      execute: async ({ owner, repo, state, limit }) =>
        withRepo(owner, repo, (t) =>
          getIssues({ userId, ...t, state, perPage: limit }),
        ),
    }),

    getFileContent: tool({
      description:
        "Read a file, or list a directory when path is '' or a folder.",
      parameters: z.object({
        ...repoParams,
        path: z.string().default(""),
        ref: z.string().optional().describe("Branch, tag or sha"),
      }),
      execute: async ({ owner, repo, path, ref }) =>
        withRepo(owner, repo, (t) =>
          getFileContent({ userId, ...t, path, ref }),
        ),
    }),

    reviewPullRequest: tool({
      description: "AI code review of one pull request.",
      parameters: z.object({
        ...repoParams,
        pullNumber: z.number().int().positive(),
      }),
      execute: async ({ owner, repo, pullNumber }) =>
        withRepo(owner, repo, (t) =>
          reviewPullRequest({ userId, ...t, pullNumber }),
        ),
    }),

    getRepositorySummary: tool({
      description: "Stored AI summary of a repo, or of all repos if none given.",
      parameters: z.object(repoParams),
      execute: async ({ owner, repo }) =>
        getRepositorySummary({
          userId,
          owner: owner || activeRepo?.owner,
          repo: repo || activeRepo?.name,
        }),
    }),

    getProjectMemory: tool({
      description:
        "Semantic search over indexed commits, PRs, issues and READMEs. Use for 'why' or history questions.",
      parameters: z.object({
        query: z.string(),
        ...repoParams,
      }),
      execute: async ({ query, owner, repo }) =>
        getProjectMemory({
          userId,
          query,
          owner: owner || activeRepo?.owner,
          repo: repo || activeRepo?.name,
          limit: 4,
        }),
    }),

    draftIssue: tool({
      description:
        "Draft a GitHub issue. Shows the user a card with a Create button; nothing is filed until they click it.",
      parameters: z.object({
        ...repoParams,
        title: z.string().max(256),
        body: z.string().max(20000).default(""),
        labels: z.array(z.string()).max(10).default([]),
      }),
      execute: async ({ owner, repo, title, body, labels }) =>
        withRepo(owner, repo, async (t) => {
          try {
            repoPath(t.owner, t.repo);
          } catch (error) {
            return { success: false as const, error: (error as Error).message };
          }
          return { success: true as const, draft: { ...t, title, body, labels } };
        }),
    }),
  } as const;
}

export type ToolRegistry = ReturnType<typeof buildToolRegistry>;
