import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetBranchesOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  perPage?: number;
}

export async function getBranches(options: GetBranchesOptions) {
  if (!options.owner || !options.repo) {
    throw new Error("Both 'owner' and 'repo' are required to fetch branches.");
  }

  const { tenant } = await getCorsairTenantClient(options);
  const targetFullName = `${options.owner}/${options.repo}`;
  const perPage = options.perPage;

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
        const resultBranches =
          perPage && perPage > 0 ? dbBranches.slice(0, perPage) : dbBranches;
        return {
          success: true,
          source: "synced_db",
          owner: options.owner,
          repo: options.repo,
          count: resultBranches.length,
          branches: resultBranches,
        };
      }
    }
  } catch (dbErr: unknown) {
    console.warn(
      `[getBranches] Local DB search note for ${targetFullName}:`,
      dbErr instanceof Error ? dbErr.message : dbErr,
    );
  }

  // 2. Fallback: Corsair Live GitHub API Proxy (corsair.github.api.repositories.listBranches)
  try {
    // @ts-ignore
    const branches = await (
      tenant as any
    ).github?.api?.repositories?.listBranches({
      owner: options.owner,
      repo: options.repo,
      ...(perPage ? { perPage } : {}),
    });
    if (branches && Array.isArray(branches)) {
      const resultBranches =
        perPage && perPage > 0 ? branches.slice(0, perPage) : branches;
      return {
        success: true,
        source: "live_api",
        owner: options.owner,
        repo: options.repo,
        count: resultBranches.length,
        branches: resultBranches,
      };
    }
  } catch (apiErr: unknown) {
    console.warn(
      `[getBranches] Live API call note for ${targetFullName}:`,
      apiErr instanceof Error ? apiErr.message : apiErr,
    );
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find branches for '${targetFullName}' via Synced DB or Live API.`,
    branches: [],
  };
}
