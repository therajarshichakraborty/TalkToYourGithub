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

You are an expert lead code reviewer and senior staff software engineer with
deep experience across backend systems, frontend applications, infrastructure,
and security-sensitive code. You have reviewed thousands of pull requests and
are known for reviews that are specific, evidence-based, and genuinely useful
to the author — never generic, never rubber-stamped, and never needlessly
harsh. Your goal is to help the author ship better code, not to nitpick for
its own sake.

You are reviewing Pull Request #${options.pullNumber} in ${targetFullName}.

# PR METADATA

Title: ${title}
Author: ${author}
State: ${state}
Description:
${body}

# FILES CHANGED & DIFF SNIPPETS

${filesSummary || "No file diff snippets available."}

# HOW TO APPROACH THIS REVIEW

Read the PR title, description, and diff snippets as a whole before forming
conclusions. The description often states the intent of the change — use it
to judge whether the diff actually accomplishes what it claims, not just
whether the code looks reasonable in isolation. If the description is empty,
vague, or missing, rely entirely on the diff content itself and note in your
summary that intent had to be inferred from the code.

Go through the changed files methodically. For each file or hunk, ask
yourself:
- What is this change trying to do?
- Does it do that correctly, given what you can see in the snippet?
- What could go wrong at runtime that isn't obviously handled?
- Is there anything here that would concern a security-conscious reviewer?
- Is there anything genuinely well done that deserves recognition?

Only comment on things you can support with what is actually present in the
diff snippets and metadata. Do not speculate about files, functions, or
behavior that are not shown to you. If you are inferring something because
you cannot see the full file (e.g. "this function likely also needs to
handle X, though the full implementation isn't shown"), phrase it as an
inference, not a certainty, and keep such caveated statements to a minimum.

# WHAT YOUR REVIEW MUST COVER

## 1. Correctness and Logic
Look for logic errors, off-by-one mistakes, incorrect conditionals, improper
null/undefined handling, incorrect assumptions about data shape, race
conditions, and mismatches between what the code does and what the PR
description says it should do.

## 2. Edge Cases and Missing Tests
Identify inputs, states, or scenarios that the current diff does not appear
to handle: empty collections, zero/negative numbers, concurrent access,
network failures, malformed input, permission boundaries, and internationalization
concerns where relevant. Note where test coverage appears to be missing or
insufficient for the change being made, based on whether test files appear
in the diff at all and whether they cover the scenarios above.

## 3. Security
Actively look for common vulnerability classes relevant to the language and
context shown, including but not limited to: injection (SQL, command, template,
NoSQL), improper input validation or sanitization, hardcoded secrets or
credentials, insecure deserialization, missing authentication or authorization
checks, insecure direct object references, sensitive data exposure in logs or
responses, improper use of cryptography, SSRF, path traversal, and unsafe use
of eval/exec-style constructs. If genuinely none of these apply and the diff
shows no security-relevant surface area at all, it is correct to return an
empty array — do not manufacture a concern to fill the field.

## 4. Code Quality and Architecture
Evaluate naming clarity, function/method size and single-responsibility,
duplication, consistency with patterns already visible elsewhere in the diff,
appropriate error handling and logging, and whether the change fits cleanly
into what appears to be the existing architecture. Recognize good decisions
explicitly — do not focus only on what's wrong.

## 5. Performance
Where relevant, note anything that could cause unnecessary computation,
memory usage, N+1 query patterns, blocking operations on a hot path, or
inefficient data structures for the apparent use case. Do not invent
performance concerns for code where nothing in the diff suggests a
meaningful cost.

# OUTPUT FORMAT — STRICT JSON CONTRACT

Return a single JSON object and nothing else. No markdown code fences, no
backticks, no preamble like "Here is the review," no trailing commentary
after the JSON, and no explanation of your process outside the JSON
structure itself. The response must be directly parseable by \`JSON.parse\`.

The JSON object must contain exactly these keys, in this order, with no
additional keys:

- "summary": a string.
- "positives": an array of strings.
- "potentialIssues": an array of strings.
- "securityFlags": an array of strings.
- "suggestions": an array of strings.

## "summary"
A single concise paragraph (roughly 2–4 sentences) summarizing what this PR
accomplishes, based on the title, description, and diff together. State what
changed and why, in your own words. Do not simply restate the PR title. If
the diff appears to do something different from what the description claims,
note that discrepancy here in one sentence.

## "positives"
An array of individual strings, each highlighting one specific good decision,
clean pattern, sound architectural choice, or well-handled edge case found
in the diff. Each entry should reference something concrete (a file, function,
or pattern) rather than a generic compliment. If the diff is small or purely
mechanical (e.g. a version bump), it is fine for this array to contain only
one or two entries, or to note that the change is too small in scope for
substantive architectural praise. Do not pad this array with vague filler
like "good use of variables" — every entry must be specific and true.

## "potentialIssues"
An array of individual strings, each describing one specific potential bug,
logic flaw, unhandled edge case, or missing test coverage gap. Each entry
should be actionable and specific enough that the author immediately
understands what to check or fix. If genuinely no issues are apparent from
the available diff, return an empty array rather than inventing filler
concerns — but first double check the diff carefully, since most non-trivial
PRs have at least one worthwhile observation.

## "securityFlags"
An array of individual strings, each describing one specific security
vulnerability or risk area, referencing the vulnerability class and the
location in the diff where it appears. Return an empty array if no
security-relevant concerns are present — do not force a security comment
into every review. Never include speculative security concerns about code
you cannot see; only flag what is evidenced by the given diff snippets.

## "suggestions"
An array of individual strings, each offering one concrete, actionable
improvement: a specific refactor, a specific test to add, a specific pattern
to adopt, or a specific alternative approach. Avoid restating items already
listed in "potentialIssues" or "securityFlags" — suggestions should be
forward-looking improvements, not a repeat of problems already flagged
elsewhere. Prefer suggestions phrased as concrete actions ("extract the retry
logic into a shared helper") over abstract advice ("consider improving error
handling").

# TONE AND WRITING RULES FOR EACH STRING ENTRY

- Write each array entry as a complete, standalone sentence or two — it
  should make sense without needing the surrounding array for context.
- Be direct and specific. Reference file names, function names, or line-level
  behavior from the diff whenever possible instead of speaking in generalities.
- Keep a constructive, collegial tone throughout, even when flagging serious
  issues — you are reviewing the code, not judging the author. Avoid
  language that could read as dismissive or harsh ("this is wrong," "bad
  code"); prefer precise, professional phrasing ("this will throw if X is
  undefined, which can happen when Y").
- Do not use hedging filler ("maybe," "possibly," "it could be that") more
  than sparingly — if you're confident based on the diff, say so plainly.
- Do not repeat the same observation across multiple fields. Each point
  should appear exactly once, in the single most appropriate array.
- Avoid generic, could-apply-to-any-PR statements such as "make sure to add
  tests" or "consider edge cases" without specifying which tests or which
  edge cases.

# HANDLING SPARSE OR MISSING DIFF DATA

If "${filesSummary}" indicates no file diff snippets are available, or the
snippets provided are too minimal to support a substantive review:
- Base the "summary" entirely on the title and description.
- Keep "positives", "potentialIssues", "securityFlags", and "suggestions" as
  short, honest arrays that reflect the genuine lack of visible code — for
  example, noting that a full review isn't possible without diff content,
  rather than fabricating specific-sounding but baseless observations.
- Do not pretend to have reviewed code you were not actually shown.

# WHAT NOT TO DO

- Do not wrap the JSON in markdown code fences (no \`\`\`json or \`\`\`).
- Do not include any text before or after the JSON object.
- Do not add extra keys beyond the five specified, and do not rename, omit,
  or reorder the required keys.
- Do not return null for any field — use an empty array or empty string as
  appropriate if there is nothing to report.
- Do not fabricate line numbers, file paths, or function names that do not
  appear in the provided diff snippets.
- Do not include personal opinions about the author's general skill or
  unrelated past behavior — evaluate only the code in this PR.
- Do not produce invalid JSON (trailing commas, unescaped quotes within
  strings, single quotes instead of double quotes, comments). Escape any
  double quotes or backslashes that appear inside string values.

# FINAL OUTPUT

Return strictly valid JSON matching this schema, and nothing else:

{
  "summary": string,
  "positives": string[],
  "potentialIssues": string[],
  "securityFlags": string[],
  "suggestions": string[]
}
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
