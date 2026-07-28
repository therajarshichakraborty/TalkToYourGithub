import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetRepositoriesOptions extends ToolContextOptions {
  perPage?: number;
}

export async function getRepositories(options: GetRepositoriesOptions = {}) {
  const { tenant } = await getCorsairTenantClient(options);
  const perPage = options.perPage || 30;

  // 1. Primary: Local Synced Corsair Database (corsair.github.db.repositories.search)
  try {
    if (tenant.github?.db?.repositories?.search) {
      const dbRepos = await tenant.github.db.repositories.search({
        limit: perPage,
      });
      if (dbRepos && Array.isArray(dbRepos) && dbRepos.length > 0) {
        return {
          success: true,
          source: "synced_db",
          count: dbRepos.length,
          repositories: dbRepos,
        };
      }
    }
  } catch (dbErr: unknown) {
    console.warn(
      `[getRepositories] Local DB search note:`,
      dbErr instanceof Error ? dbErr.message : dbErr,
    );
  }

  // 2. Fallback: Corsair Live GitHub API Proxy (corsair.github.api.repositories.list)
  try {
    const repos = await tenant.github.api.repositories.list({ perPage });
    if (repos && Array.isArray(repos)) {
      return {
        success: true,
        source: "live_api",
        count: repos.length,
        repositories: repos,
      };
    }
  } catch (apiErr: unknown) {
    console.warn(
      `[getRepositories] Live API call note:`,
      apiErr instanceof Error ? apiErr.message : apiErr,
    );
  }

  return {
    success: false,
    error: "Could not fetch repositories via Synced DB or Live API.",
    repositories: [],
  };
}
