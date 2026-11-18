import {
  githubPaginate,
  resolveUserId,
  toErrorMessage,
  type GithubAuthContext,
} from "@/lib/github/client";
import type { Repository } from "@/lib/github/types";

interface RawRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  default_branch: string;
  language: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  html_url: string;
  updated_at: string | null;
  pushed_at: string | null;
}

export interface GetRepositoriesOptions extends GithubAuthContext {
  limit?: number;
  force?: boolean;
}

export type GetRepositoriesResult =
  | { success: true; count: number; repositories: Repository[] }
  | { success: false; count: 0; repositories: []; error: string };

const CACHE_TTL_MS = 2 * 60 * 1000;
const cache = new Map<string, { at: number; repositories: Repository[] }>();

function normalize(raw: RawRepository): Repository {
  return {
    id: String(raw.id),
    owner: raw.owner.login,
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description ?? "",
    defaultBranch: raw.default_branch,
    language: raw.language,
    isPrivate: raw.private,
    isFork: raw.fork,
    isArchived: raw.archived,
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    openIssues: raw.open_issues_count,
    htmlUrl: raw.html_url,
    updatedAt: raw.updated_at,
    pushedAt: raw.pushed_at,
  };
}

async function fetchAll(ctx: GithubAuthContext): Promise<Repository[]> {
  const raw = await githubPaginate<RawRepository>(ctx, "/user/repos", {
    affiliation: "owner,collaborator,organization_member",
    sort: "pushed",
    direction: "desc",
  });
  return raw.map(normalize);
}

export async function getRepositories(
  options: GetRepositoriesOptions,
): Promise<GetRepositoriesResult> {
  try {
    const userId = await resolveUserId(options);
    const cached = cache.get(userId);
    const fresh = cached && Date.now() - cached.at < CACHE_TTL_MS;

    let repositories: Repository[];
    if (fresh && !options.force) {
      repositories = cached.repositories;
    } else {
      repositories = await fetchAll({ userId });
      cache.set(userId, { at: Date.now(), repositories });
    }

    const limited = options.limit
      ? repositories.slice(0, options.limit)
      : repositories;

    return { success: true, count: limited.length, repositories: limited };
  } catch (error) {
    return {
      success: false,
      count: 0,
      repositories: [],
      error: toErrorMessage(error),
    };
  }
}
