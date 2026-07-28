import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetIssuesOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  perPage?: number;
}

export async function getIssues(options: GetIssuesOptions) {
  if (!options.owner || !options.repo) {
    throw new Error("Both 'owner' and 'repo' are required to fetch issues.");
  }

  const { tenant } = await getCorsairTenantClient(options);
  const perPage = options.perPage || 30;
  const state = options.state || "all";

  try {
    const issues = await tenant.github.api.issues.list({
      owner: options.owner,
      repo: options.repo,
      state,
      perPage,
    });
    return {
      success: true,
      owner: options.owner,
      repo: options.repo,
      count: issues.length,
      issues,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      owner: options.owner,
      repo: options.repo,
      error: message,
      issues: [],
    };
  }
}
