import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface CreateIssueOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export async function createIssue(options: CreateIssueOptions) {
  if (!options.owner || !options.repo || !options.title) {
    throw new Error("Parameters 'owner', 'repo', and 'title' are required to create an issue.");
  }

  const { tenant } = await getCorsairTenantClient(options);
  const targetFullName = `${options.owner}/${options.repo}`;

  try {
    const issue = await tenant.github.api.issues.create({
      owner: options.owner,
      repo: options.repo,
      title: options.title,
      body: options.body,
      labels: options.labels,
      assignees: options.assignees,
    });

    if (issue) {
      return {
        success: true,
        action: "created_issue",
        owner: options.owner,
        repo: options.repo,
        issue: {
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body ?? null,
          state: issue.state,
          htmlUrl: issue.htmlUrl ?? null,
          createdAt: issue.createdAt ?? null,
        },
      };
    }
  } catch (apiErr: unknown) {
    const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
    const isRateLimited = errMsg.toLowerCase().includes("rate limit") || errMsg.includes("403") || errMsg.includes("429");

    console.warn(
      `[createIssue] Live API write call note for ${targetFullName}:`,
      errMsg,
      isRateLimited ? "(Rate Limit / Secondary Limit Detected)" : ""
    );

    return {
      success: false,
      owner: options.owner,
      repo: options.repo,
      title: options.title,
      isRateLimited,
      error: isRateLimited
        ? `GitHub API secondary/write rate limit reached while creating issue on '${targetFullName}'.`
        : `Could not create issue on '${targetFullName}': ${errMsg}`,
      issue: null,
    };
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    title: options.title,
    error: `Failed to create issue on '${targetFullName}' via Live API.`,
    issue: null,
  };
}
