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
  const targetFullName = `${options.owner}/${options.repo}`;

  // 1. Primary: Local Synced Corsair Database (corsair.github.db.pullRequests.search)
  try {
    if (tenant.github?.db?.pullRequests?.search) {
      const dbPrs = await tenant.github.db.pullRequests.search({});
      if (dbPrs && Array.isArray(dbPrs) && dbPrs.length > 0) {
        return {
          success: true,
          source: "synced_db",
          owner: options.owner,
          repo: options.repo,
          count: dbPrs.length,
          pullRequests: dbPrs,
        };
      }
    }
  } catch (dbErr: unknown) {
    console.warn(`[getPullRequests] Local DB search note for ${targetFullName}:`, dbErr instanceof Error ? dbErr.message : dbErr);
  }

  // 2. Fallback: Corsair Live GitHub API Proxy (corsair.github.api.pullRequests.list)
  try {
    const prs = await tenant.github.api.pullRequests.list({
      owner: options.owner,
      repo: options.repo,
      state,
      perPage,
    });
    if (prs && Array.isArray(prs)) {
      return {
        success: true,
        source: "live_api",
        owner: options.owner,
        repo: options.repo,
        count: prs.length,
        pullRequests: prs,
      };
    }
  } catch (apiErr: unknown) {
    console.warn(`[getPullRequests] Live API call note for ${targetFullName}:`, apiErr instanceof Error ? apiErr.message : apiErr);
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find pull requests for '${targetFullName}' via Synced DB or Live API.`,
    pullRequests: [],
  };
}
