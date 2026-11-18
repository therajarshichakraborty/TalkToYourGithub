import {
  githubGet,
  repoPath,
  toErrorMessage,
  type GithubAuthContext,
} from "@/lib/github/client";
import type { Issue } from "@/lib/github/types";

export interface GetIssuesOptions extends GithubAuthContext {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  perPage?: number;
}

interface RawIssue {
  number: number;
  title: string;
  state: string;
  user: { login: string } | null;
  labels: Array<string | { name?: string }>;
  comments: number;
  updated_at: string;
  html_url: string;
}

interface SearchResponse {
  total_count: number;
  items: RawIssue[];
}

function normalize(issue: RawIssue): Issue {
  return {
    number: issue.number,
    title: issue.title,
    state: issue.state,
    author: issue.user?.login ?? "unknown",
    labels: issue.labels
      .map((l) => (typeof l === "string" ? l : (l.name ?? "")))
      .filter(Boolean),
    comments: issue.comments,
    updatedAt: issue.updated_at,
    url: issue.html_url,
  };
}

export async function getIssues({
  owner,
  repo,
  state = "open",
  perPage = 10,
  ...ctx
}: GetIssuesOptions) {
  try {
    repoPath(owner, repo);
    const qualifiers = [`repo:${owner}/${repo}`, "is:issue"];
    if (state !== "all") qualifiers.push(`is:${state}`);

    const data = await githubGet<SearchResponse>(ctx, "/search/issues", {
      q: qualifiers.join(" "),
      sort: "updated",
      order: "desc",
      per_page: perPage,
    });

    const issues = data.items.map(normalize);
    return {
      success: true as const,
      total: data.total_count,
      count: issues.length,
      issues,
    };
  } catch (error) {
    return {
      success: false as const,
      error: toErrorMessage(error),
      total: 0,
      issues: [] as Issue[],
    };
  }
}
