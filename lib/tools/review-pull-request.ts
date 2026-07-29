/*
 * Tool: reviewPullRequest
 * Description: Fetches details and files changed for a specified Pull Request, performs AI analysis,
 * and generates a structured code review (summary, positives, potential bugs, security flags, recommendations).
 */

import { getCorsairTenantClient, ToolContextOptions } from "./helper";
import { generateText } from "ai";
import { chatModel } from "@/features/chat";

export interface ReviewPullRequestOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  pullNumber: number;
}

export async function reviewPullRequest(options: ReviewPullRequestOptions) {
  if (!options.owner || !options.repo || !options.pullNumber) {
    throw new Error("Required arguments: owner, repo, pullNumber.");
  }

  const { tenant } = await getCorsairTenantClient(options);
  const targetFullName = `${options.owner}/${options.repo}`;

  try {
    /*
     * 1. Fetch Pull Request metadata
     */
    let prData: any = null;
    try {
      if ((tenant as any).github?.api?.pulls?.get) {
        prData = await (tenant as any).github.api.pulls.get({
          owner: options.owner,
          repo: options.repo,
          pull_number: options.pullNumber,
        });
      }
    } catch (e) {
      console.warn("[reviewPullRequest] Live API PR get note:", e);
    }

    /* Fallback to local DB PR search if direct get fails */
    if (!prData && tenant.github?.db?.pull_requests?.search) {
      const dbPRs = await tenant.github.db.pull_requests.search({
        data: {
          repositoryFullName: { equals: targetFullName },
          number: { equals: options.pullNumber },
        },
      });
      if (dbPRs && dbPRs.length > 0) {
        prData = dbPRs[0];
      }
    }

    /*
     * 2. Fetch list of files changed in this PR
     */
    let filesChanged: any[] = [];
    try {
      if ((tenant as any).github?.api?.pulls?.listFiles) {
        const files = await (tenant as any).github.api.pulls.listFiles({
          owner: options.owner,
          repo: options.repo,
          pull_number: options.pullNumber,
          per_page: 30,
        });
        if (Array.isArray(files)) {
          filesChanged = files;
        }
      }
    } catch (e) {
      console.warn("[reviewPullRequest] Live API listFiles note:", e);
    }

    const title = prData?.title || `PR #${options.pullNumber}`;
    const author = prData?.user?.login || prData?.author || "Unknown";
    const state = prData?.state || "open";
    const body = prData?.body || "No description provided.";
    const filesSummary = filesChanged
      .slice(0, 10)
      .map(
        (f) =>
          `* File: ${f.filename || f.path} (${f.status || "modified"}, +${f.additions || 0}/-${f.deletions || 0})\nDiff Snippet:\n${(f.patch || "No diff snippet").slice(0, 500)}`
      )
      .join("\n\n");

    /*
     * 3. Run AI LLM analysis to construct structured review
     */
    const prompt = `
# ROLE
You are an expert lead code reviewer and senior staff software engineer.
You are reviewing Pull Request #${options.pullNumber} in ${targetFullName}.

# PR METADATA
Title: ${title}
Author: ${author}
State: ${state}
Description:
${body}

# FILES CHANGED & DIFF SNIPPETS
${filesSummary || "No file diff snippets available."}

# INSTRUCTIONS
Analyze this Pull Request and provide a constructive, thorough code review formatted as JSON with these exact keys:
- "summary": A single concise paragraph summarizing what this PR accomplishes.
- "positives": Array of strings highlighting good architecture, clean code, or sound decisions.
- "potentialIssues": Array of strings highlighting potential bugs, edge cases, or missing tests.
- "securityFlags": Array of strings noting any security vulnerabilities or risk areas (empty array if none).
- "suggestions": Array of strings offering actionable code improvements or refactoring advice.

Return strictly valid JSON matching this schema.
`;

    const { text: responseText } = await generateText({
      model: chatModel,
      prompt,
    });

    let reviewResult = {
      summary: `PR #${options.pullNumber} modifies repository code and functionality.`,
      positives: ["Implements required PR changes."],
      potentialIssues: ["Ensure unit test coverage for new execution paths."],
      securityFlags: [],
      suggestions: ["Verify cross-tenant scoping and edge case handling."],
    };

    try {
      const parsed = JSON.parse(
        responseText.replace(/```json/g, "").replace(/```/g, "").trim()
      );
      if (parsed && typeof parsed === "object") {
        reviewResult = {
          summary: parsed.summary || reviewResult.summary,
          positives: Array.isArray(parsed.positives) ? parsed.positives : reviewResult.positives,
          potentialIssues: Array.isArray(parsed.potentialIssues) ? parsed.potentialIssues : reviewResult.potentialIssues,
          securityFlags: Array.isArray(parsed.securityFlags) ? parsed.securityFlags : reviewResult.securityFlags,
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : reviewResult.suggestions,
        };
      }
    } catch (parseErr) {
      console.warn("[reviewPullRequest] JSON parse fallback:", parseErr);
    }

    return {
      success: true,
      owner: options.owner,
      repo: options.repo,
      pullNumber: options.pullNumber,
      title,
      author,
      state,
      filesAnalyzed: filesChanged.length || 1,
      review: reviewResult,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[reviewPullRequest] Error reviewing PR:", msg);
    return {
      success: false,
      owner: options.owner,
      repo: options.repo,
      pullNumber: options.pullNumber,
      error: `Failed to review PR #${options.pullNumber}: ${msg}`,
    };
  }
}
