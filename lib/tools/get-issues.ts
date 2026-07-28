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
  const targetFullName = `${options.owner}/${options.repo}`;

  // 1. Primary: Local Synced Corsair Database (corsair.github.db.issues.search)
  try {
    if (tenant.github?.db?.issues?.search) {
      const dbIssues = await tenant.github.db.issues.search({});
      if (dbIssues && Array.isArray(dbIssues) && dbIssues.length > 0) {
        return {
          success: true,
          source: "synced_db",
          owner: options.owner,
          repo: options.repo,
          count: dbIssues.length,
          issues: dbIssues,
        };
      }
    }
  } catch (dbErr: unknown) {
    console.warn(`[getIssues] Local DB search note for ${targetFullName}:`, dbErr instanceof Error ? dbErr.message : dbErr);
  }

  // 2. Fallback: Corsair Live GitHub API Proxy (corsair.github.api.issues.list)
  try {
    const issues = await tenant.github.api.issues.list({
      owner: options.owner,
      repo: options.repo,
      state,
      perPage,
    });
    if (issues && Array.isArray(issues)) {
      return {
        success: true,
        source: "live_api",
        owner: options.owner,
        repo: options.repo,
        count: issues.length,
        issues,
      };
    }
  } catch (apiErr: unknown) {
    console.warn(`[getIssues] Live API call note for ${targetFullName}:`, apiErr instanceof Error ? apiErr.message : apiErr);
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find issues for '${targetFullName}' via Synced DB or Live API.`,
    issues: [],
  };
}
