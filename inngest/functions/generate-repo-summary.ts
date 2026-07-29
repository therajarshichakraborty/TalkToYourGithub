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

export const generateRepoSummary = inngest.createFunction(
  {
    id: "generate-repo-summary",
    name: "Generate Repository Summary",
  },
  { event: "github.connected" },
  async ({ event, step }) => {
    const { userId, corsairTenantId, repositoryOwner, repositoryName } =
      event.data;

    if (!userId && !corsairTenantId) {
      throw new Error(
        "[generateRepoSummary] Missing required userId or corsairTenantId in event data.",
      );
    }

    // Step 1: Fetch user repositories and verify tenant connection
    const targetRepos = await step.run("fetch-target-repositories", async () => {
      const { tenantId } = await getCorsairTenantClient({
        userId,
        tenantId: corsairTenantId,
      });

      const repoResult = await getRepositories({
        userId,
        tenantId,
        perPage: 20,
      });

      if (!repoResult.success || !repoResult.repositories?.length) {
        console.warn(
          `[generateRepoSummary] No repositories found for tenant '${tenantId}'`,
        );
        return [];
      }

      let repos = repoResult.repositories.map((r) => {
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

      // Filter if specific repo requested
      if (repositoryOwner && repositoryName) {
        repos = repos.filter(
          (r) =>
            r.owner.toLowerCase() === repositoryOwner.toLowerCase() &&
            r.name.toLowerCase() === repositoryName.toLowerCase(),
        );
      }

      return repos;
    });

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
      const repoContext = await step.run(
        `fetch-context-${owner}-${name}`,
        async () => {
          const [commitsRes, branchesRes, prsRes, issuesRes, readmeRes] =
            await Promise.allSettled([
              getCommits({ userId, tenantId: corsairTenantId, owner, repo: name, perPage: 10 }),
              getBranches({ userId, tenantId: corsairTenantId, owner, repo: name, perPage: 10 }),
              getPullRequests({ userId, tenantId: corsairTenantId, owner, repo: name, state: "all", perPage: 10 }),
              getIssues({ userId, tenantId: corsairTenantId, owner, repo: name, state: "all", perPage: 10 }),
              getFileContent({ userId, tenantId: corsairTenantId, owner, repo: name, path: "README.md" }),
            ]);

          const commits: any[] = commitsRes.status === "fulfilled" && commitsRes.value.success ? (commitsRes.value.commits as any[]) : [];
          const branches: any[] = branchesRes.status === "fulfilled" && branchesRes.value.success ? (branchesRes.value.branches as any[]) : [];
          const pullRequests = prsRes.status === "fulfilled" && prsRes.value.success ? prsRes.value.pullRequests : [];
          const issues = issuesRes.status === "fulfilled" && issuesRes.value.success ? issuesRes.value.issues : [];
          const readme = readmeRes.status === "fulfilled" && readmeRes.value.success ? readmeRes.value.content : null;

          return {
            owner,
            name,
            description,
            defaultBranch,
            language,
            recentCommits: commits.slice(0, 5).map((c) => ({
              message: c.commit?.message || c.message || "",
              author: c.commit?.author?.name || c.author || "",
              date: c.commit?.author?.date || c.date || "",
            })),
            branches: branches.slice(0, 5).map((b) => b.name),
            pullRequestCount: pullRequests.length,
            issueCount: issues.length,
            readmeSnippet: readme ? readme.slice(0, 1500) : "No README.md available.",
          };
        },
      );

      // Step 3: Generate summary with AI model
      const generatedSummary = await step.run(
        `generate-ai-summary-${owner}-${name}`,
        async () => {
          const prompt = `
Generate a comprehensive, clear, and well-structured summary of the following GitHub repository:

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

Write a detailed 2 to 3 paragraph summary covering:
1. What the repository is about and its primary purpose.
2. Architecture, technology stack, key components, and notable features.
3. Recent activity, project vitality, open issues, or development status.
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
        `save-summary-to-db-${owner}-${name}`,
        async () => {
          // Resolve exact userId if not passed directly in event
          let resolvedUserId = userId;
          if (!resolvedUserId && corsairTenantId) {
            const [u] = await db
              .select({ id: schema.user.id })
              .from(schema.user)
              .where(eq(schema.user.corsairTenantId, corsairTenantId));
            if (u) resolvedUserId = u.id;
          }

          if (!resolvedUserId) {
            throw new Error(
              `[generateRepoSummary] Could not resolve userId for tenant '${corsairTenantId}'`,
            );
          }

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
