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

  try {
    const commits = await tenant.github.api.repositories.listCommits({
      owner: options.owner,
      repo: options.repo,
      perPage,
    });
    return {
      success: true,
      owner: options.owner,
      repo: options.repo,
      count: commits.length,
      commits,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      owner: options.owner,
      repo: options.repo,
      error: message,
      commits: [],
    };
  }
}
