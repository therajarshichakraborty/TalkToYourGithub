import {
  githubGet,
  repoPath,
  toErrorMessage,
  type GithubAuthContext,
} from "@/lib/github/client";

export interface GetBranchesOptions extends GithubAuthContext {
  owner: string;
  repo: string;
  perPage?: number;
}

export async function getBranches({
  owner,
  repo,
  perPage = 30,
  ...ctx
}: GetBranchesOptions) {
  try {
    const raw = await githubGet<Array<{ name: string; protected: boolean }>>(
      ctx,
      repoPath(owner, repo, "/branches"),
      { per_page: perPage },
    );
    const branches = raw.map((b) => b.name);
    return { success: true as const, count: branches.length, branches };
  } catch (error) {
    return {
      success: false as const,
      error: toErrorMessage(error),
      branches: [] as string[],
    };
  }
}
