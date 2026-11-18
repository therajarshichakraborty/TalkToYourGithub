import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

const GITHUB_API = "https://api.github.com";
const MAX_PAGES = 20;

export class GithubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GithubError";
  }
}

export interface GithubAuthContext {
  userId?: string;
  tenantId?: string;
}

type QueryValue = string | number | boolean | undefined;

const SLUG = /^[A-Za-z0-9_.-]{1,100}$/;

export function repoPath(owner: string, repo: string, suffix = "") {
  if (!SLUG.test(owner) || !SLUG.test(repo) || owner === ".." || repo === "..") {
    throw new GithubError(`Invalid repository name "${owner}/${repo}".`, 400);
  }
  return `/repos/${owner}/${repo}${suffix}`;
}

export async function resolveUserId(ctx: GithubAuthContext): Promise<string> {
  if (ctx.userId) return ctx.userId;

  if (ctx.tenantId) {
    const [row] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.corsairTenantId, ctx.tenantId))
      .limit(1);
    if (row) return row.id;
  }

  throw new GithubError("No user context supplied for GitHub request.", 401);
}

export async function getGithubToken(ctx: GithubAuthContext): Promise<string> {
  const userId = await resolveUserId(ctx);
  const [account] = await db
    .select({ accessToken: schema.account.accessToken })
    .from(schema.account)
    .where(
      and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "github"),
      ),
    )
    .limit(1);

  if (!account?.accessToken) {
    throw new GithubError(
      "GitHub account is not connected. Sign in with GitHub again.",
      401,
    );
  }

  return account.accessToken;
}

function buildUrl(path: string, query: Record<string, QueryValue> = {}) {
  const url = new URL(path.startsWith("http") ? path : `${GITHUB_API}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "talk-to-your-github",
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new GithubError(
      body?.message ?? `GitHub request failed (${res.status})`,
      res.status,
    );
  }

  return res;
}

export async function githubGet<T>(
  ctx: GithubAuthContext,
  path: string,
  query?: Record<string, QueryValue>,
): Promise<T> {
  const token = await getGithubToken(ctx);
  const res = await request(token, buildUrl(path, query));
  return (await res.json()) as T;
}

export async function githubPost<T>(
  ctx: GithubAuthContext,
  path: string,
  body: unknown,
): Promise<T> {
  const token = await getGithubToken(ctx);
  const res = await request(token, buildUrl(path), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return (await res.json()) as T;
}

function nextLink(header: string | null): string | null {
  if (!header) return null;
  const match = header
    .split(",")
    .find((part) => part.includes('rel="next"'))
    ?.match(/<([^>]+)>/);
  return match?.[1] ?? null;
}

export async function githubCount(
  ctx: GithubAuthContext,
  path: string,
  query: Record<string, QueryValue> = {},
): Promise<number> {
  const token = await getGithubToken(ctx);
  const res = await request(token, buildUrl(path, { ...query, per_page: 1 }));
  const last = res.headers
    .get("link")
    ?.split(",")
    .find((part) => part.includes('rel="last"'))
    ?.match(/[?&]page=(\d+)/);
  if (last) return Number(last[1]);
  const items = (await res.json()) as unknown[];
  return items.length;
}

export async function githubPaginate<T>(
  ctx: GithubAuthContext,
  path: string,
  query: Record<string, QueryValue> = {},
  maxPages = MAX_PAGES,
): Promise<T[]> {
  const token = await getGithubToken(ctx);
  const items: T[] = [];
  let url: string | null = buildUrl(path, { per_page: 100, ...query });
  let page = 0;

  while (url && page < maxPages) {
    const res = await request(token, url);
    items.push(...((await res.json()) as T[]));
    url = nextLink(res.headers.get("link"));
    page += 1;
  }

  return items;
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
