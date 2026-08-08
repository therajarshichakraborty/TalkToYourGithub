import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetIssuesOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  perPage?: number;
}

export async function getIssues(options: GetIssuesOptions) {
  if (!options.owner || !options.repo) {
    throw new Error("Both 'owner' and 'repo' are required to fetch issues.");
  }

  const perPage = options.perPage || 30;
  const state = options.state || "all";
  const targetFullName = `${options.owner}/${options.repo}`;

  // 1. Try Corsair API / Synced DB
  try {
    const { tenant } = await getCorsairTenantClient(options);
    if (tenant.github?.db?.issues?.search) {
      const dbIssues = await tenant.github.db.issues.search({});
      if (dbIssues && Array.isArray(dbIssues) && dbIssues.length > 0) {
        return {
          success: true,
          source: "synced_db",
          owner: options.owner,
          repo: options.repo,
          count: dbIssues.length,
          issues: dbIssues,
        };
      }
    }

    const issues = await (tenant as any).github?.api?.issues?.list({
      owner: options.owner,
      repo: options.repo,
      state,
      perPage,
    });
    if (issues && Array.isArray(issues) && issues.length > 0) {
      return {
        success: true,
        source: "corsair_api",
        owner: options.owner,
        repo: options.repo,
        count: issues.length,
        issues,
      };
    }
  } catch (corsairErr: unknown) {
    console.warn(
      `[getIssues] Corsair note for ${targetFullName}:`,
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

    let ghRes = await fetch(
      `https://api.github.com/repos/${options.owner}/${options.repo}/issues?state=${state}&per_page=${perPage}`,
      { headers: reqHeaders },
    );

    if (!ghRes.ok && reqHeaders.Authorization) {
      delete reqHeaders.Authorization;
      ghRes = await fetch(
        `https://api.github.com/repos/${options.owner}/${options.repo}/issues?state=${state}&per_page=${perPage}`,
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
          issues: data,
        };
      }
    }
  } catch (restErr: unknown) {
    console.warn(
      `[getIssues] GitHub REST API fallback note for ${targetFullName}:`,
      restErr instanceof Error ? restErr.message : restErr,
    );
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    error: `Could not find issues for '${targetFullName}'.`,
    issues: [],
  };
}

