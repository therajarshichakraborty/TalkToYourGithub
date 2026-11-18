import {
  githubGet,
  repoPath,
  toErrorMessage,
  type GithubAuthContext,
} from "@/lib/github/client";
import type { Commit } from "@/lib/github/types";

export interface GetCommitsOptions extends GithubAuthContext {
  owner: string;
  repo: string;
  branch?: string;
  perPage?: number;
}

interface RawCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  author: { login: string } | null;
}

export async function getCommits({
  owner,
  repo,
  branch,
  perPage = 10,
  ...ctx
}: GetCommitsOptions) {
  try {
    const raw = await githubGet<RawCommit[]>(
      ctx,
      repoPath(owner, repo, "/commits"),
      { per_page: perPage, sha: branch },
    );
    const commits: Commit[] = raw.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0].slice(0, 120),
      author: c.author?.login ?? c.commit.author?.name ?? "unknown",
      date: c.commit.author?.date ?? "",
    }));
    return { success: true as const, count: commits.length, commits };
  } catch (error) {
    return {
      success: false as const,
      error: toErrorMessage(error),
      commits: [] as Commit[],
    };
  }
}
