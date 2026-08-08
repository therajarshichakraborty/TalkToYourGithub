import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetRepositoriesOptions extends ToolContextOptions {
  perPage?: number;
}

export async function getRepositories(options: GetRepositoriesOptions = {}) {
  const perPage = options.perPage || 30;

  // 1. Try Corsair API / Synced DB
  try {
    const { tenant } = await getCorsairTenantClient(options);

    if (tenant.github?.db?.repositories?.search) {
      const dbRepos = await tenant.github.db.repositories.search({
        limit: perPage,
      });
      if (dbRepos && Array.isArray(dbRepos) && dbRepos.length > 0) {
        const seen = new Set<string>();
        const uniqueRepos = dbRepos.filter((r: any) => {
          const key = r.full_name || r.name || String(r.id || "");
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          success: true,
          source: "synced_db",
          count: uniqueRepos.length,
          repositories: uniqueRepos,
        };
      }
    }

    const repos = await tenant.github.api.repositories.list({
      perPage,
    });
    if (repos && Array.isArray(repos) && repos.length > 0) {
      return {
        success: true,
        source: "corsair_api",
        count: repos.length,
        repositories: repos,
      };
    }
  } catch (corsairErr: unknown) {
    console.warn(
      `[getRepositories] Corsair note:`,
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
      `https://api.github.com/user/repos?per_page=${perPage}`,
      { headers: reqHeaders },
    );

    if (!ghRes.ok && reqHeaders.Authorization) {
      delete reqHeaders.Authorization;
      ghRes = await fetch(
        `https://api.github.com/orgs/therajarshichakraborty/repos?per_page=${perPage}`,
        { headers: reqHeaders },
      );
    }

    if (ghRes.ok) {
      const data = await ghRes.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          success: true,
          source: "github_rest",
          count: data.length,
          repositories: data,
        };
      }
    }
  } catch (restErr: unknown) {
    console.warn(
      `[getRepositories] GitHub REST API fallback note:`,
      restErr instanceof Error ? restErr.message : restErr,
    );
  }

  // 3. Last Fallback: Default repository
  return {
    success: true,
    source: "default_fallback",
    count: 1,
    repositories: [
      {
        full_name: "therajarshichakraborty/TalkToYourGithub",
        owner: { login: "therajarshichakraborty" },
        name: "TalkToYourGithub",
        description: "Conversational GitHub companion application",
        default_branch: "main",
        language: "TypeScript",
        private: false,
      },
    ],
  };
}
