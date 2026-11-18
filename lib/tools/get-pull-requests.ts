import {
  githubGet,
  repoPath,
  toErrorMessage,
  type GithubAuthContext,
} from "@/lib/github/client";
import type { PullRequest } from "@/lib/github/types";

export interface GetPullRequestsOptions extends GithubAuthContext {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  perPage?: number;
}

interface RawPullRequest {
  number: number;
  title: string;
  state: string;
  draft?: boolean;
  merged_at: string | null;
  user: { login: string } | null;
  updated_at: string;
  html_url: string;
}

export async function getPullRequests({
  owner,
  repo,
  state = "open",
  perPage = 10,
  ...ctx
}: GetPullRequestsOptions) {
  try {
    const raw = await githubGet<RawPullRequest[]>(
      ctx,
      repoPath(owner, repo, "/pulls"),
      { state, per_page: perPage, sort: "updated", direction: "desc" },
    );
    const pullRequests: PullRequest[] = raw.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      author: pr.user?.login ?? "unknown",
      draft: Boolean(pr.draft),
      merged: Boolean(pr.merged_at),
      updatedAt: pr.updated_at,
      url: pr.html_url,
    }));
    return { success: true as const, count: pullRequests.length, pullRequests };
  } catch (error) {
    return {
      success: false as const,
      error: toErrorMessage(error),
      pullRequests: [] as PullRequest[],
    };
  }
}
