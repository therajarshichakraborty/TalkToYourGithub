import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetRepositoriesOptions extends ToolContextOptions {
  perPage?: number;
}

export async function getRepositories(options: GetRepositoriesOptions = {}) {
  const { tenant } = await getCorsairTenantClient(options);
  const perPage = options.perPage || 30;

  try {
    const repos = await tenant.github.api.repositories.list({ perPage });
    return {
      success: true,
      count: repos.length,
      repositories: repos,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
      repositories: [],
    };
  }
}
