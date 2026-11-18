import {
  githubPost,
  repoPath,
  toErrorMessage,
  type GithubAuthContext,
} from "@/lib/github/client";

export interface CreateIssueOptions extends GithubAuthContext {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

interface RawCreatedIssue {
  number: number;
  title: string;
  state: string;
  html_url: string;
}

export async function createIssue({
  owner,
  repo,
  title,
  body,
  labels,
  assignees,
  ...ctx
}: CreateIssueOptions) {
  try {
    const issue = await githubPost<RawCreatedIssue>(
      ctx,
      repoPath(owner, repo, "/issues"),
      {
        title,
        body: body || undefined,
        labels: labels?.length ? labels : undefined,
        assignees: assignees?.length ? assignees : undefined,
      },
    );
    return {
      success: true as const,
      issue: {
        number: issue.number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url,
      },
    };
  } catch (error) {
    return { success: false as const, error: toErrorMessage(error) };
  }
}
