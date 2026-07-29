/**
 * tool-registry.ts
 * Wraps every raw tool function (Days 8-10, Day 14) in an AI SDK `tool()` definition.
 * Each entry declares the Zod input schema and an execute function that
 * passes the authenticated userId through to the underlying helper.
 *
 * Usage:
 *   import { buildToolRegistry } from "@/features/chat/tool-registry";
 *   const tools = buildToolRegistry({ userId });
 *   // pass `tools` directly to streamText()
 */

import { tool } from "ai";
import { z } from "zod";
import { getRepositories } from "@/lib/tools/get-repositories";
import { getBranches } from "@/lib/tools/get-branches";
import { getCommits } from "@/lib/tools/get-commits";
import { getPullRequests } from "@/lib/tools/get-pull-requests";
import { getIssues } from "@/lib/tools/get-issues";
import { getFileContent } from "@/lib/tools/get-file-content";
import { createIssue } from "@/lib/tools/create-issue";
import { getRepositorySummary } from "@/lib/tools/get-repository-summary";
import { getProjectMemory } from "@/lib/tools/get-project-memory";

import { reviewPullRequest } from "@/lib/tools/review-pull-request";

/**
 * Context required to build tool registry for authenticated session.
 */
export interface ToolRegistryContext {
  userId: string;
}

/**
 * Builds AI SDK tool registry bound to current authenticated user.
 */
export function buildToolRegistry(ctx: ToolRegistryContext) {
  return {
    getRepositories: tool({
      description:
        "List all GitHub repositories that are synced for the authenticated user. " +
        "Call this first whenever the user refers to 'my repos', 'my projects', or an ambiguous repo name.",
      parameters: z.object({
        perPage: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Maximum number of repositories to return (default 30)."),
      }),
      execute: async ({ perPage }) => {
        return getRepositories({ userId: ctx.userId, perPage });
      },
    }),

    getBranches: tool({
      description:
        "List all branches in a specific repository. " +
        "Reads from the local Corsair mirror first and falls back to the live GitHub API.",
      parameters: z.object({
        owner: z
          .string()
          .describe(
            "GitHub username or organisation that owns the repository.",
          ),
        repo: z
          .string()
          .describe("Repository name (without the owner prefix)."),
        perPage: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Number of branches to return (default 30)."),
      }),
      execute: async ({ owner, repo, perPage }) => {
        return getBranches({ userId: ctx.userId, owner, repo, perPage });
      },
    }),

    getCommits: tool({
      description:
        "List recent commits in a repository via the live GitHub API. " +
        "Returns author, message, sha, and timestamp for each commit.",
      parameters: z.object({
        owner: z
          .string()
          .describe(
            "GitHub username or organisation that owns the repository.",
          ),
        repo: z.string().describe("Repository name."),
        perPage: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Number of commits to fetch (default 30)."),
      }),
      execute: async ({ owner, repo, perPage }) => {
        return getCommits({ userId: ctx.userId, owner, repo, perPage });
      },
    }),

    getPullRequests: tool({
      description:
        "List pull requests in a repository. " +
        "Supports filtering by state: open, closed, or all (default all). " +
        "Reads from the local Corsair mirror first and falls back to the live GitHub API.",
      parameters: z.object({
        owner: z
          .string()
          .describe(
            "GitHub username or organisation that owns the repository.",
          ),
        repo: z.string().describe("Repository name."),
        state: z
          .enum(["open", "closed", "all"])
          .optional()
          .describe(
            "Filter by pull request state. Defaults to 'all' if omitted.",
          ),
        perPage: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Number of pull requests to return (default 30)."),
      }),
      execute: async ({ owner, repo, state, perPage }) => {
        return getPullRequests({
          userId: ctx.userId,
          owner,
          repo,
          state,
          perPage,
        });
      },
    }),

    reviewPullRequest: tool({
      description:
        "Perform an AI-powered code review on a specific Pull Request by PR number. " +
        "Analyzes PR description and file diffs, returning structured review sections (summary, positives, potential bugs, security flags, recommendations).",
      parameters: z.object({
        owner: z.string().describe("GitHub owner or organization."),
        repo: z.string().describe("Repository name."),
        pullNumber: z.number().int().positive().describe("Pull request number to review (e.g. 1, 42)."),
      }),
      execute: async ({ owner, repo, pullNumber }) => {
        return reviewPullRequest({
          userId: ctx.userId,
          owner,
          repo,
          pullNumber,
        });
      },
    }),

    getIssues: tool({
      description:
        "List issues in a repository. " +
        "Supports filtering by state: open, closed, or all (default all). " +
        "Reads from the local Corsair mirror first and falls back to the live GitHub API.",
      parameters: z.object({
        owner: z
          .string()
          .describe(
            "GitHub username or organisation that owns the repository.",
          ),
        repo: z.string().describe("Repository name."),
        state: z
          .enum(["open", "closed", "all"])
          .optional()
          .describe("Filter by issue state. Defaults to 'all' if omitted."),
        perPage: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Number of issues to return (default 30)."),
      }),
      execute: async ({ owner, repo, state, perPage }) => {
        return getIssues({ userId: ctx.userId, owner, repo, state, perPage });
      },
    }),

    getFileContent: tool({
      description:
        "Read the content of a specific file or list directory contents in a repository " +
        "via the live GitHub API. Use this to inspect source code, configuration files, " +
        "or any file at a given path. For directories it returns a list of child items.",
      parameters: z.object({
        owner: z
          .string()
          .describe(
            "GitHub username or organisation that owns the repository.",
          ),
        repo: z.string().describe("Repository name."),
        path: z
          .string()
          .optional()
          .default("")
          .describe(
            "File or directory path relative to repository root. Pass '' or omit to list root directory, or pass 'src/' / 'lib/auth.ts'.",
          ),
        ref: z
          .string()
          .optional()
          .describe(
            "Branch name, tag, or commit SHA to read from (defaults to the repository's default branch).",
          ),
      }),
      execute: async ({ owner, repo, path, ref }) => {
        return getFileContent({ userId: ctx.userId, owner, repo, path, ref });
      },
    }),

    createIssue: tool({
      description:
        "Create a new issue in a GitHub repository via the live GitHub API. " +
        "This is a write operation: always confirm the title and repository with the user before calling this tool.",
      parameters: z.object({
        owner: z
          .string()
          .describe(
            "GitHub username or organisation that owns the repository.",
          ),
        repo: z.string().describe("Repository name."),
        title: z.string().describe("The title of the issue to create."),
        body: z
          .string()
          .optional()
          .describe(
            "Optional markdown body text that describes the issue in detail.",
          ),
        labels: z
          .array(z.string())
          .optional()
          .describe(
            "Optional list of label names to attach to the issue (e.g. ['bug', 'help wanted']).",
          ),
        assignees: z
          .array(z.string())
          .optional()
          .describe(
            "Optional list of GitHub usernames to assign the issue to.",
          ),
      }),
      execute: async ({ owner, repo, title, body, labels, assignees }) => {
        return createIssue({
          userId: ctx.userId,
          owner,
          repo,
          title,
          body,
          labels,
          assignees,
        });
      },
    }),

    getRepositorySummary: tool({
      description:
        "Fetch pre-generated high-level summaries of repositories directly from the local database. " +
        "Use this for fast repository overviews or when the user asks for a summary of their project.",
      parameters: z.object({
        owner: z
          .string()
          .optional()
          .describe("Optional GitHub username or organisation owner."),
        repo: z.string().optional().describe("Optional repository name."),
      }),
      execute: async ({ owner, repo }) => {
        return getRepositorySummary({
          userId: ctx.userId,
          owner,
          repo,
        });
      },
    }),

    getProjectMemory: tool({
      description:
        "Perform semantic search across stored project embeddings (commits, PRs, issues, README) in pgvector database. " +
        "Use this when answering questions about project history, why decisions were made, or finding relevant code/PR context.",
      parameters: z.object({
        query: z
          .string()
          .describe(
            "Search query string or question to match against project vector memory.",
          ),
        owner: z
          .string()
          .optional()
          .describe("Optional repository owner to scope the search."),
        repo: z
          .string()
          .optional()
          .describe("Optional repository name to scope the search."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe(
            "Maximum number of vector memory items to return (default 5).",
          ),
      }),
      execute: async ({ query, owner, repo, limit }) => {
        return getProjectMemory({
          userId: ctx.userId,
          query,
          owner,
          repo,
          limit,
        });
      },
    }),
  } as const;
}

export type ToolRegistry = ReturnType<typeof buildToolRegistry>;
