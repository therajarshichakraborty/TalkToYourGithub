import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetBranchesOptions extends ToolContextOptions {
  owner: string;
  repo: string;
}

export async function getBranches(options: GetBranchesOptions) {
  if (!options.owner || !options.repo) {
    throw new Error("Both 'owner' and 'repo' are required to fetch branches.");
  }

  const { tenant } = await getCorsairTenantClient(options);
  const targetFullName = `${options.owner}/${options.repo}`;

  // 1. Primary: Local Synced Corsair Database (corsair.github.db.branches.search)
  try {
    if (tenant.github?.db?.branches?.search) {
      let dbBranches = await tenant.github.db.branches.search({
        data: {
          repositoryFullName: { equals: targetFullName },
        },
      });

      if (!dbBranches || dbBranches.length === 0) {
        dbBranches = await tenant.github.db.branches.search({
          data: {
            repositoryFullName: { contains: options.repo },
          },
        });
      }

      if (dbBranches && dbBranches.length > 0) {
        return {
          success: true,
          source: "synced_db",
          owner: options.owner,
          repo: options.repo,
          count: dbBranches.length,
          branches: dbBranches,
        };
      }
    }
  } catch (dbErr: unknown) {
    console.warn(`[getBranches] Local DB search note for ${targetFullName}:`, dbErr instanceof Error ? dbErr.message : dbErr);
  }

  // 2. Fallback: Corsair Live GitHub API Proxy (corsair.github.api.repositories.listBranches)
  try {
    const branches = await tenant.github.api.repositories.listBranches({
      owner: options.owner,
      repo: options.repo,
    });
    if (branches && Array.isArray(branches)) {
      return {
        success: true,
        source: "live_api",
        owner: options.owner,
        repo: options.repo,
        count: branches.length,
        branches,
      };
    }
  } catch (apiErr: unknown) {
    console.warn(`[getBranches] Live API call note for ${targetFullName}:`, apiErr instanceof Error ? apiErr.message : apiErr);
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find branches for '${targetFullName}' via Synced DB or Live API.`,
    branches: [],
  };
}
