import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetPullRequestsOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  perPage?: number;
}

export async function getPullRequests(options: GetPullRequestsOptions) {
  if (!options.owner || !options.repo) {
    throw new Error("Both 'owner' and 'repo' are required to fetch pull requests.");
  }

  const { tenant } = await getCorsairTenantClient(options);
  const perPage = options.perPage || 30;
  const state = options.state || "all";

  try {
    const prs = await tenant.github.api.pullRequests.list({
      owner: options.owner,
      repo: options.repo,
      state,
      perPage,
    });
    return {
      success: true,
      owner: options.owner,
      repo: options.repo,
      count: prs.length,
      pullRequests: prs,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      owner: options.owner,
      repo: options.repo,
      error: message,
      pullRequests: [],
    };
  }
}
