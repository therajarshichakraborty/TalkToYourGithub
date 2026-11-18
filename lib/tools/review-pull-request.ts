import { generateObject } from "ai";
import { z } from "zod";
import { chatModel } from "@/features/chat/openai";
import {
  githubGet,
  repoPath,
  toErrorMessage,
  type GithubAuthContext,
} from "@/lib/github/client";

export interface ReviewPullRequestOptions extends GithubAuthContext {
  owner: string;
  repo: string;
  pullNumber: number;
}

interface RawPull {
  title: string;
  body: string | null;
  state: string;
  user: { login: string } | null;
  html_url: string;
}

interface RawPullFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

const MAX_FILES = 8;
const MAX_PATCH_CHARS = 1200;

const reviewSchema = z.object({
  summary: z.string(),
  issues: z.array(z.string()),
  security: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export type PullRequestReview = z.infer<typeof reviewSchema>;

const REVIEW_SYSTEM =
  "You are a senior code reviewer. Judge only the diff shown. Be specific (file/function), terse, no filler. Empty arrays when nothing applies. Max 4 items per array, each one sentence.";

export async function reviewPullRequest({
  owner,
  repo,
  pullNumber,
  ...ctx
}: ReviewPullRequestOptions) {
  try {
    const base = repoPath(owner, repo, `/pulls/${pullNumber}`);
    const [pr, files] = await Promise.all([
      githubGet<RawPull>(ctx, base),
      githubGet<RawPullFile[]>(ctx, `${base}/files`, { per_page: MAX_FILES }),
    ]);

    const diff = files
      .slice(0, MAX_FILES)
      .map(
        (f) =>
          `## ${f.filename} (${f.status} +${f.additions}/-${f.deletions})\n${(f.patch ?? "").slice(0, MAX_PATCH_CHARS)}`,
      )
      .join("\n\n");

    const { object: review } = await generateObject({
      model: chatModel,
      schema: reviewSchema,
      system: REVIEW_SYSTEM,
      prompt: `PR #${pullNumber} "${pr.title}"\n${(pr.body ?? "").slice(0, 600)}\n\n${diff || "No diff available."}`,
      maxTokens: 600,
      temperature: 0.2,
    });

    return {
      success: true as const,
      owner,
      repo,
      pullNumber,
      title: pr.title,
      author: pr.user?.login ?? "unknown",
      state: pr.state,
      url: pr.html_url,
      filesReviewed: Math.min(files.length, MAX_FILES),
      review,
    };
  } catch (error) {
    return {
      success: false as const,
      owner,
      repo,
      pullNumber,
      error: toErrorMessage(error),
    };
  }
}
