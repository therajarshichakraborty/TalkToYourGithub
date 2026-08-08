import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetPullRequestsOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  perPage?: number;
}

export async function getPullRequests(options: GetPullRequestsOptions) {
  if (!options.owner || !options.repo) {
    throw new Error(
      "Both 'owner' and 'repo' are required to fetch pull requests.",
    );
  }

  const perPage = options.perPage || 30;
  const state = options.state || "all";
  const targetFullName = `${options.owner}/${options.repo}`;

  // 1. Try Corsair API / Synced DB
  try {
    const { tenant } = await getCorsairTenantClient(options);
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

    const prs = await (tenant as any).github?.api?.pullRequests?.list({
      owner: options.owner,
      repo: options.repo,
      state,
      perPage,
    });
    if (prs && Array.isArray(prs) && prs.length > 0) {
      return {
        success: true,
        source: "corsair_api",
        owner: options.owner,
        repo: options.repo,
        count: prs.length,
        pullRequests: prs,
      };
    }
  } catch (corsairErr: unknown) {
    console.warn(
      `[getPullRequests] Corsair note for ${targetFullName}:`,
      corsairErr instanceof Error ? corsairErr.message : corsairErr,
    );
  }

  // 2. Direct GitHub REST API Fallback
  try {
    const token = process.env.GITHUB_TOKEN;
    const reqHeaders: Record<string, string> = {
      "User-Agent": "TalkToYourGithub",
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    const ghRes = await fetch(
      `https://api.github.com/repos/${options.owner}/${options.repo}/pulls?state=${state}&per_page=${perPage}`,
      { headers: reqHeaders },
    );

    if (ghRes.ok) {
      const data = await ghRes.json();
      if (Array.isArray(data)) {
        return {
          success: true,
          source: "github_rest",
          owner: options.owner,
          repo: options.repo,
          count: data.length,
          pullRequests: data,
        };
      }
    }
  } catch (restErr: unknown) {
    console.warn(
      `[getPullRequests] GitHub REST API fallback note for ${targetFullName}:`,
      restErr instanceof Error ? restErr.message : restErr,
    );
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find pull requests for '${targetFullName}'.`,
    pullRequests: [],
  };
}

