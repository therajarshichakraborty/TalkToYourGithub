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

  const perPage = options.perPage || 30;
  const targetFullName = `${options.owner}/${options.repo}`;

  // 1. Try Corsair Live API Proxy
  try {
    const { tenant } = await getCorsairTenantClient(options);
    const commits = await (
      tenant as any
    ).github?.api?.repositories?.listCommits({
      owner: options.owner,
      repo: options.repo,
      perPage,
    });
    if (commits && Array.isArray(commits) && commits.length > 0) {
      return {
        success: true,
        source: "corsair_api",
        owner: options.owner,
        repo: options.repo,
        count: commits.length,
        commits,
      };
    }
  } catch (corsairErr: unknown) {
    console.warn(
      `[getCommits] Corsair API note for ${targetFullName}:`,
      corsairErr instanceof Error ? corsairErr.message : corsairErr,
    );
  }

  // 2. Direct GitHub REST API Fallback (using GITHUB_TOKEN if available)
  try {
    const token = process.env.GITHUB_TOKEN;
    const reqHeaders: Record<string, string> = {
      "User-Agent": "TalkToYourGithub",
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    let ghRes = await fetch(
      `https://api.github.com/repos/${options.owner}/${options.repo}/commits?per_page=${perPage}`,
      { headers: reqHeaders },
    );

    if (!ghRes.ok && reqHeaders.Authorization) {
      delete reqHeaders.Authorization;
      ghRes = await fetch(
        `https://api.github.com/repos/${options.owner}/${options.repo}/commits?per_page=${perPage}`,
        { headers: reqHeaders },
      );
    }

    if (ghRes.ok) {
      const data = await ghRes.json();
      if (Array.isArray(data)) {
        return {
          success: true,
          source: "github_rest",
          owner: options.owner,
          repo: options.repo,
          count: data.length,
          commits: data,
        };
      }
    }
  } catch (restErr: unknown) {
    console.warn(
      `[getCommits] GitHub REST API fallback note for ${targetFullName}:`,
      restErr instanceof Error ? restErr.message : restErr,
    );
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find commits for '${targetFullName}'.`,
    commits: [],
  };
}
