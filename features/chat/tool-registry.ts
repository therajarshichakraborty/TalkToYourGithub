/**
 * tool-registry.ts
 * Wraps every raw tool function (Days 8-10) in an AI SDK `tool()` definition.
 * Each entry declares the Zod input schema and an execute function that
 * passes the authenticated userId through to the underlying Corsair helper.
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

export interface ToolRegistryContext {
  userId: string;
}

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
          .describe("GitHub username or organisation that owns the repository."),
        repo: z
          .string()
          .describe("Repository name (without the owner prefix)."),
      }),
      execute: async ({ owner, repo }) => {
        return getBranches({ userId: ctx.userId, owner, repo });
      },
    }),

    getCommits: tool({
      description:
        "List recent commits in a repository via the live GitHub API. " +
        "Returns author, message, sha, and timestamp for each commit.",
      parameters: z.object({
        owner: z
          .string()
          .describe("GitHub username or organisation that owns the repository."),
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
          .describe("GitHub username or organisation that owns the repository."),
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
        return getPullRequests({ userId: ctx.userId, owner, repo, state, perPage });
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
          .describe("GitHub username or organisation that owns the repository."),
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
          .describe("GitHub username or organisation that owns the repository."),
        repo: z.string().describe("Repository name."),
        path: z
          .string()
          .describe(
            "File or directory path relative to the repository root (e.g. 'src/index.ts' or 'src/').",
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
        "This is a write operation — always confirm the title and repository with the user before calling this tool.",
      parameters: z.object({
        owner: z
          .string()
          .describe("GitHub username or organisation that owns the repository."),
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
  } as const;
}

export type ToolRegistry = ReturnType<typeof buildToolRegistry>;
