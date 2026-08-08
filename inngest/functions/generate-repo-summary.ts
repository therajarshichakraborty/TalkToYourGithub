import { inngest } from "../client";
import { getCorsairTenantClient } from "@/lib/tools/helper";
import { getRepositories } from "@/lib/tools/get-repositories";
import { getCommits } from "@/lib/tools/get-commits";
import { getBranches } from "@/lib/tools/get-branches";
import { getPullRequests } from "@/lib/tools/get-pull-requests";
import { getIssues } from "@/lib/tools/get-issues";
import { getFileContent } from "@/lib/tools/get-file-content";
import { generateText } from "ai";
import { chatModel } from "@/features/chat";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface RepoContext {
  owner: string;
  name: string;
  description: string;
  defaultBranch: string;
  language: string;
  recentCommits: Array<{ message: string; author: string; date: string }>;
  branches: string[];
  pullRequestCount: number;
  issueCount: number;
  readmeSnippet: string;
}

export const generateRepoSummary = inngest.createFunction(
  {
    id: "generate-repo-summary",
    name: "Generate Repository Summary",
  },
  { event: "github.connected" },
  async ({ event, step }) => {
    const { userId, corsairTenantId, repositoryOwner, repositoryName } =
      event.data;

    // Resolve a REAL userId upfront — DB FK constraint requires a valid user row
    let resolvedUserId = userId;
    if (!resolvedUserId && corsairTenantId) {
      const [u] = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.corsairTenantId, corsairTenantId));
      if (u) resolvedUserId = u.id;
    }
    if (!resolvedUserId) {
      const [defaultUser] = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .limit(1);
      if (defaultUser) resolvedUserId = defaultUser.id;
    }
    if (!resolvedUserId) {
      throw new Error(
        `[generateRepoSummary] Could not resolve a valid userId. Please sign in to the app first so a user record exists in the database.`,
      );
    }

    const runSuffix = event.id ? `-${event.id}` : "";

    // Step 1: Fetch user repositories and verify tenant connection
    const targetRepos = await step.run(
      `fetch-target-repositories${runSuffix}`,
      async () => {
        let repos: Array<{
          owner: string;
          name: string;
          description: string;
          defaultBranch: string;
          language: string;
          isPrivate: boolean;
          stars: number;
        }> = [];

        try {
          const { tenantId } = await getCorsairTenantClient({
            userId: resolvedUserId,
            tenantId: corsairTenantId,
          });

          const repoResult = await getRepositories({
            userId: resolvedUserId,
            tenantId,
            perPage: 100,
          });

          repos = (repoResult.repositories || []).map((r: any) => {
            const full_name = r.full_name || r.fullName || "";
            const parts = full_name.split("/");
            return {
              owner: r.owner?.login || r.owner || parts[0] || "",
              name: r.name || parts[1] || "",
              description: r.description || "",
              defaultBranch: r.default_branch || r.defaultBranch || "main",
              language: r.language || "Unknown",
              isPrivate: r.private ?? false,
              stars: r.stargazers_count ?? 0,
            };
          });
        } catch (clientErr) {
          console.warn(
            "[generateRepoSummary] Note fetching tenant client:",
            clientErr instanceof Error ? clientErr.message : clientErr,
          );
        }

        // Filter if specific repo requested
        if (repositoryOwner && repositoryName) {
          const filtered = repos.filter(
            (r) =>
              r.owner.toLowerCase() === repositoryOwner.toLowerCase() &&
              r.name.toLowerCase() === repositoryName.toLowerCase(),
          );
          if (filtered.length > 0) {
            repos = filtered;
          } else {
            // Fallback: target the requested repo directly
            repos = [
              {
                owner: repositoryOwner,
                name: repositoryName,
                description: "",
                defaultBranch: "main",
                language: "Unknown",
                isPrivate: false,
                stars: 0,
              },
            ];
          }
        }

        if (!repos.length) {
          repos = [
            {
              owner: "therajarshichakraborty",
              name: "TalkToYourGithub",
              description: "Conversational GitHub companion application",
              defaultBranch: "main",
              language: "TypeScript",
              isPrivate: false,
              stars: 0,
            },
          ];
        }

        return repos;
      },
    );

    if (!targetRepos.length) {
      return {
        success: true,
        message: "No matching repositories to process.",
        processedCount: 0,
      };
    }

    const summariesCreated: Array<{ owner: string; name: string; id: string }> =
      [];

    // Process each target repository
    for (const repo of targetRepos) {
      const { owner, name, description, defaultBranch, language } = repo;

      if (!owner || !name) continue;

      // Step 2: Gather context data for the repository
      const repoContext: RepoContext = await step.run(
        `fetch-context-${owner}-${name}${runSuffix}`,
        async (): Promise<RepoContext> => {
          const [commitsRes, branchesRes, prsRes, issuesRes, readmeRes] =
            await Promise.allSettled([
              getCommits({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                perPage: 10,
              }),
              getBranches({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                perPage: 10,
              }),
              getPullRequests({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                state: "all",
                perPage: 10,
              }),
              getIssues({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                state: "all",
                perPage: 10,
              }),
              getFileContent({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                path: "README.md",
              }),
            ]);

          const commits =
            commitsRes.status === "fulfilled" && commitsRes.value.success
              ? commitsRes.value.commits
              : [];
          const rawBranches =
            branchesRes.status === "fulfilled" && branchesRes.value.success
              ? (branchesRes.value.branches as any[])
              : [];
          const pullRequests =
            prsRes.status === "fulfilled" && prsRes.value.success
              ? prsRes.value.pullRequests
              : [];
          const issues =
            issuesRes.status === "fulfilled" && issuesRes.value.success
              ? issuesRes.value.issues
              : [];
          const readme =
            readmeRes.status === "fulfilled" && readmeRes.value.success
              ? readmeRes.value.content
              : null;

          return {
            owner,
            name,
            description,
            defaultBranch,
            language,
            recentCommits: commits.slice(0, 5).map((c: any) => ({
              message: String(c.commit?.message || c.message || ""),
              author: String(c.commit?.author?.name || c.author || ""),
              date: String(c.commit?.author?.date || c.date || ""),
            })),
            branches: rawBranches
              .slice(0, 5)
              .map((b: any) => (typeof b === "string" ? b : b?.name || ""))
              .filter(Boolean),
            pullRequestCount: pullRequests.length,
            issueCount: issues.length,
            readmeSnippet: readme
              ? readme.slice(0, 1500)
              : "No README.md available.",
          };
        },
      );

      // Step 3: Generate summary with AI model
      const generatedSummary = await step.run(
        `generate-ai-summary-${owner}-${name}${runSuffix}`,
        async () => {
          const prompt = `
# ROLE

You are a senior software engineer and technical writer who specializes in
reading unfamiliar codebases quickly and explaining them clearly to other
engineers, hiring managers, and open-source contributors. You have reviewed
thousands of repositories across every major language and framework. Your
summaries are known for being accurate, specific, and free of filler.

Your job in this task is to read the repository metadata provided below and
produce a single, high-quality written summary of the repository. You will
not have access to the full source tree, so you must reason carefully from
the limited signals you are given (README, commit messages, language,
branches, issue/PR counts) rather than inventing details you cannot support.

# REPOSITORY CONTEXT

Repository: ${repoContext.owner}/${repoContext.name}
Description: ${repoContext.description || "N/A"}
Primary Language: ${repoContext.language}
Default Branch: ${repoContext.defaultBranch}
Branches Count (Sampled): ${repoContext.branches.length} (${repoContext.branches.join(", ")})
Pull Requests Count: ${repoContext.pullRequestCount}
Issues Count: ${repoContext.issueCount}

Recent Commit Messages:
${repoContext.recentCommits.map((c) => `- ${c.message} (by ${c.author})`).join("\n") || "No recent commits."}

README Preview:
${repoContext.readmeSnippet}

# OBJECTIVE

Write a detailed 2 to 3 paragraph summary of this repository. The summary
must read as a single cohesive piece of writing, not as a list of bullet
points or a form filled out field by field. It should sound like it was
written by a knowledgeable engineer who actually looked at the project, not
like a template with blanks filled in.

The summary must cover exactly these three areas, in this order:

1. What the repository is about and its primary purpose.
2. Architecture, technology stack, key components, and notable features.
3. Recent activity, project vitality, open issues, and development status.

# PARAGRAPH 1 — PURPOSE

Explain, in your own words, what problem this project solves and who it is
for. Do not simply repeat the description field verbatim; synthesize it with
whatever the README preview tells you about the project's goals, target
users, and use cases. If the description and README appear to conflict or
one is missing, rely on whichever source is more informative and note the
gap only if it materially affects understanding — do not dwell on missing
data.

If the repository name, description, or README suggests a well-known
category of project (e.g. a CLI tool, a REST API, a UI component library, a
data pipeline, a machine learning model, a browser extension, a game, an
infrastructure-as-code module), name that category explicitly. This gives
the reader an immediate mental model before you go into specifics.

Avoid vague openers like "This repository is a project that..." — start with
substance. Prefer sentences that state directly what the software does:
what it takes as input, what it produces, or what workflow it automates.

# PARAGRAPH 2 — ARCHITECTURE AND TECH STACK

Ground this paragraph in the Primary Language field and anything the README
or commit messages reveal about frameworks, libraries, build tools, or
infrastructure (e.g. Docker, CI/CD configs, database technologies, cloud
providers, testing frameworks). Only state technologies you have direct
evidence for from the provided context — do not guess at a stack the
repository has not indicated.

Where the README or commits mention specific components, modules, services,
or directories (e.g. "auth service", "worker queue", "frontend client",
"CLI entrypoint"), describe how they likely relate to one another based on
naming and conventional architecture patterns for that kind of stack. Be
explicit when you are inferring rather than quoting a stated fact, e.g. "the
commit history suggests a monorepo structure with separate frontend and
backend packages."

Call out anything notable: unusual architectural choices, a monorepo vs.
single-package layout, presence of multiple branches suggesting active
parallel development streams, evidence of testing or CI setup, containerization,
or any distinguishing technical feature that sets this project apart from a
generic implementation in its category.

If the available context is too thin to say anything concrete about
architecture (e.g. an empty or near-empty README and no informative
commits), say so plainly in one sentence and pivot to what can be inferred
from the language and repository name alone, rather than padding with
generic statements that could apply to any repository.

# PARAGRAPH 3 — ACTIVITY AND PROJECT STATUS

Use the recent commit messages to characterize the current phase of
development. Distinguish between signals such as:
- Active feature development (commits adding new functionality)
- Stabilization (commits focused on bug fixes, refactors, cleanup)
- Maintenance mode (sparse, infrequent, or purely dependency-bump commits)
- Early scaffolding (initial commit, setup, boilerplate)

Reference the Pull Requests Count and Issues Count to comment on community
engagement and project health. Use judgment about what these numbers mean in
context — a small number of issues on a brand-new repo reads differently
than a small number of issues on a mature, widely-used one. Do not assign
a precise health score or rating; describe the situation in prose.

If commit authorship shows multiple distinct contributors, note that the
project has more than one active contributor. If commits appear to come from
a single author, note that this looks like a single-maintainer project
without implying anything negative — many excellent projects are maintained
by one person.

If "No recent commits." is shown, state plainly that no recent commit
activity was available in the provided context, and avoid speculating about
whether the project is abandoned — simply note that recency cannot be
assessed from the given data.

# STYLE AND TONE RULES

- Write in clear, professional, engaging prose — the register of a strong
  engineering blog post or a project README's "About" section, not a
  corporate report and not overly casual.
- Use active voice. Prefer "The project uses X to do Y" over passive
  constructions like "X is used by the project."
- Be specific over general. "Uses Express with a PostgreSQL database via
  Prisma" is far more useful than "uses modern backend technologies."
- Do not use bullet points, numbered lists, or headers in the output. The
  final summary must be flowing paragraphs only.
- Do not repeat the same fact in more than one paragraph.
- Do not editorialize about code quality, correctness, or the team's
  competence. Stick to describing what exists and what the evidence shows.
- Do not use hedging filler like "it seems," "it appears," "possibly" more
  than once or twice total — when you are inferring rather than stating a
  known fact, say so once clearly and move on confidently.
- Avoid marketing language ("cutting-edge," "revolutionary," "world-class",
  "seamless", "robust" used as a throwaway adjective). Let the specifics
  speak for themselves.
- Do not restate the raw metadata fields verbatim as a list inside your
  answer (e.g. do not write "Language: TypeScript, Branches: 3"). Weave the
  information into sentences.
- Keep the whole summary to 2–3 paragraphs total, each roughly 4–7
  sentences. Do not pad for length; every sentence should carry information.

# HANDLING MISSING OR SPARSE DATA

Some fields in the context may be "N/A", empty, or minimal. When this
happens:
- Never invent specifics (fake tech stack names, fake numbers, fake
  features) to fill a gap.
- Briefly acknowledge the limitation in a single clause rather than an
  entire sentence of caveats, then continue with what can be reasonably
  said from the remaining evidence.
- If the README preview is truncated mid-sentence, do not treat the cutoff
  as meaningful — just use the content that is present.
- If almost nothing is available across all fields, it is acceptable for
  the summary to be shorter than usual, but it must still directly address
  all three required topics in some form, even if briefly.

# WHAT NOT TO DO

- Do not output the summary as JSON, YAML, or any structured format —
  plain prose paragraphs only.
- Do not include a title, heading, or "Summary:" label before the text.
- Do not include meta-commentary about the task itself (e.g. do not write
  "Based on the provided context, here is a summary...").
- Do not ask the reader questions or address them directly ("you might
  wonder...").
- Do not quote large verbatim blocks from the README; paraphrase in your
  own words except for short technical terms, proper nouns, or exact
  library/framework names, which should be used as-is for accuracy.
- Do not fabricate contributor names, dates, version numbers, or license
  details that were not provided in the context.

# FINAL OUTPUT

Return only the final 2–3 paragraph summary as plain text. No preamble, no
closing remarks, no formatting markup, no code fences.
`.trim();

          const { text } = await generateText({
            model: chatModel,
            system:
              "You are an expert software developer and technical documentation specialist. Write clear, accurate, and insightful summaries of GitHub repositories based on the provided metadata and code context.",
            prompt,
          });

          return text;
        },
      );

      // Step 4: Write or update repository summary in DB
      const recordId = await step.run(
        `save-summary-to-db-${owner}-${name}${runSuffix}`,
        async () => {
          const existing = await db
            .select()
            .from(schema.repositorySummaries)
            .where(
              and(
                eq(schema.repositorySummaries.userId, resolvedUserId),
                eq(schema.repositorySummaries.repositoryOwner, owner),
                eq(schema.repositorySummaries.repositoryName, name),
              ),
            );

          const now = new Date();
          if (existing.length > 0) {
            await db
              .update(schema.repositorySummaries)
              .set({
                summary: generatedSummary,
                updatedAt: now,
                generatedAt: now,
              })
              .where(eq(schema.repositorySummaries.id, existing[0].id));
            return existing[0].id;
          } else {
            const [inserted] = await db
              .insert(schema.repositorySummaries)
              .values({
                userId: resolvedUserId,
                repositoryOwner: owner,
                repositoryName: name,
                summary: generatedSummary,
                generatedAt: now,
              })
              .returning({ id: schema.repositorySummaries.id });
            return inserted.id;
          }
        },
      );

      summariesCreated.push({ owner, name, id: recordId });
    }

    return {
      success: true,
      processedCount: summariesCreated.length,
      summaries: summariesCreated,
    };
  },
);
