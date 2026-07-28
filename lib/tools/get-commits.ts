import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetCommitsOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  perPage?: number;
}

export async function getCommits(options: GetCommitsOptions) {
  if (!options.owner || !options.repo) {
    throw new Error("Both 'owner' and 'repo' are required to fetch commits.");
  }

  const { tenant } = await getCorsairTenantClient(options);
  const perPage = options.perPage || 30;
  const targetFullName = `${options.owner}/${options.repo}`;

  // 1. Primary: Local Synced Events/DB (corsair.github.db.events.search)
  try {
    if (tenant.github?.db?.events?.search) {
      const dbEvents = await tenant.github.db.events.search({});
      if (dbEvents && Array.isArray(dbEvents) && dbEvents.length > 0) {
        return {
          success: true,
          source: "synced_db_events",
          owner: options.owner,
          repo: options.repo,
          count: dbEvents.length,
          commits: dbEvents,
        };
      }
    }
  } catch (dbErr: unknown) {
    console.warn(`[getCommits] Local DB events search note for ${targetFullName}:`, dbErr instanceof Error ? dbErr.message : dbErr);
  }

  // 2. Fallback: Corsair Live GitHub API Proxy (corsair.github.api.repositories.listCommits)
  try {
    const commits = await tenant.github.api.repositories.listCommits({
      owner: options.owner,
      repo: options.repo,
      perPage,
    });
    if (commits && Array.isArray(commits)) {
      return {
        success: true,
        source: "live_api",
        owner: options.owner,
        repo: options.repo,
        count: commits.length,
        commits,
      };
    }
  } catch (apiErr: unknown) {
    console.warn(`[getCommits] Live API call note for ${targetFullName}:`, apiErr instanceof Error ? apiErr.message : apiErr);
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find commits for '${targetFullName}' via Synced DB or Live API.`,
    commits: [],
  };
}
