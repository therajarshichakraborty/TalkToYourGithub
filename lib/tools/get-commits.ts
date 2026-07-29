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

  // Fetch commits via Corsair Live GitHub API Proxy (corsair.github.api.repositories.listCommits)
  try {
    // @ts-ignore
    const commits = await (tenant as any).github?.api?.repositories?.listCommits({
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
    console.warn(
      `[getCommits] Live API call note for ${targetFullName}:`,
      apiErr instanceof Error ? apiErr.message : apiErr,
    );
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find commits for '${targetFullName}' via Live API.`,
    commits: [],
  };
}
