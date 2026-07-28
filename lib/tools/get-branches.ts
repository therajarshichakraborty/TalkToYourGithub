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

  try {
    const branches = await tenant.github.api.repositories.listBranches({
      owner: options.owner,
      repo: options.repo,
    });
    return {
      success: true,
      owner: options.owner,
      repo: options.repo,
      count: branches.length,
      branches,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      owner: options.owner,
      repo: options.repo,
      error: message,
      branches: [],
    };
  }
}
