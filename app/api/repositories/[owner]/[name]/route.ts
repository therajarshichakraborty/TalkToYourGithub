import { generateText } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { chatModel } from "@/features/chat/openai";
import { auth } from "@/lib/auth";
import {
  githubCount,
  githubGet,
  GithubError,
  repoPath,
  toErrorMessage,
} from "@/lib/github/client";
import {
  buildSummaryPrompt,
  findSummary,
  saveSummary,
  SUMMARY_SYSTEM_PROMPT,
} from "@/lib/summaries";
import { getBranches } from "@/lib/tools/get-branches";
import { getCommits } from "@/lib/tools/get-commits";
import { getIssues } from "@/lib/tools/get-issues";
import { getPullRequests } from "@/lib/tools/get-pull-requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RawRepo {
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  html_url: string;
  pushed_at: string | null;
  topics?: string[];
}

async function fetchReadme(userId: string, owner: string, name: string) {
  try {
    const data = await githubGet<{ content: string; encoding: string }>(
      { userId },
      repoPath(owner, name, "/readme"),
    );
    return Buffer.from(data.content, data.encoding as BufferEncoding).toString(
      "utf-8",
    );
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ owner: string; name: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owner, name } = await params;
  const userId = session.user.id;
  const target = { userId, owner, repo: name };

  try {
    const countOrNull = (path: string, query?: Record<string, string>) =>
      githubCount({ userId }, repoPath(owner, name, path), query).catch(() => null);

    const [
      repo,
      commits,
      branches,
      pulls,
      issues,
      readme,
      stored,
      activity,
      branchCount,
      pullCount,
    ] = await Promise.all([
        githubGet<RawRepo>({ userId }, repoPath(owner, name)),
        getCommits({ ...target, perPage: 10 }),
        getBranches({ ...target, perPage: 30 }),
        getPullRequests({ ...target, state: "open", perPage: 20 }),
        getIssues({ ...target, state: "open", perPage: 20 }),
        fetchReadme(userId, owner, name),
        findSummary({ userId, owner, name }),
        db
          .select({
            id: schema.activityLogs.id,
            type: schema.activityLogs.activityType,
            title: schema.activityLogs.title,
            description: schema.activityLogs.description,
            occurredAt: schema.activityLogs.occurredAt,
          })
          .from(schema.activityLogs)
          .where(
            and(
              eq(schema.activityLogs.userId, userId),
              eq(schema.activityLogs.repositoryOwner, owner),
              eq(schema.activityLogs.repositoryName, name),
            ),
          )
          .orderBy(desc(schema.activityLogs.occurredAt))
          .limit(30),
        countOrNull("/branches"),
        countOrNull("/pulls", { state: "open" }),
      ]);

    let summary = stored?.summary ?? null;
    let summaryGeneratedAt = stored?.generatedAt ?? null;

    if (!summary) {
      try {
        const { text } = await generateText({
          model: chatModel,
          system: SUMMARY_SYSTEM_PROMPT,
          prompt: buildSummaryPrompt({
            fullName: repo.full_name,
            description: repo.description,
            language: repo.language,
            commits: commits.commits.map((c) => c.message),
            readme,
          }),
          maxTokens: 220,
          temperature: 0.3,
        });
        if (text.trim()) {
          summary = text.trim();
          summaryGeneratedAt = new Date();
          await saveSummary({ userId, owner, name }, summary);
        }
      } catch (error) {
        console.error(`[repo] summary failed for ${owner}/${name}`, error);
      }
    }

    const openPullRequests = pullCount ?? pulls.pullRequests.length;
    const openIssues = issues.success
      ? issues.total
      : Math.max(repo.open_issues_count - openPullRequests, 0);

    return Response.json({
      success: true,
      repo: {
        owner,
        name,
        fullName: repo.full_name,
        description: repo.description ?? "",
        defaultBranch: repo.default_branch,
        language: repo.language,
        isPrivate: repo.private,
        htmlUrl: repo.html_url,
        pushedAt: repo.pushed_at,
        topics: repo.topics ?? [],
      },
      stats: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        branches: branchCount ?? branches.branches.length,
        openPullRequests,
        openIssues,
      },
      summary,
      summaryGeneratedAt: summaryGeneratedAt?.toISOString() ?? null,
      commits: commits.commits,
      pullRequests: pulls.pullRequests,
      issues: issues.issues,
      branches: branches.branches,
      readme: readme ? readme.slice(0, 4000) : null,
      activity: activity.map((a) => ({
        ...a,
        occurredAt: a.occurredAt.toISOString(),
      })),
    });
  } catch (error) {
    const status = error instanceof GithubError ? error.status : 500;
    console.error(`[repo] load failed for ${owner}/${name}`, error);
    return Response.json(
      { error: toErrorMessage(error) },
      { status: status >= 400 && status < 500 ? status : 500 },
    );
  }
}
