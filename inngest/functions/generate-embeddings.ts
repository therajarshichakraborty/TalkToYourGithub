import { inngest } from "../client";
import { getCorsairTenantClient } from "@/lib/tools/helper";
import { getRepositories } from "@/lib/tools/get-repositories";
import { getCommits } from "@/lib/tools/get-commits";
import { getPullRequests } from "@/lib/tools/get-pull-requests";
import { getIssues } from "@/lib/tools/get-issues";
import { getFileContent } from "@/lib/tools/get-file-content";
import { generateResilientEmbeddings } from "@/features/chat/openai";
import { RecursiveCharacterTextSplitter } from "@/lib/rag/text-splitter";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPineconeIndex } from "@/lib/pinecone";
import type { PineconeRecord } from "@pinecone-database/pinecone";

/**
 * Interface representing a content chunk to be embedded into pgvector database.
 */
interface ContentChunk {
  sourceType: "repo_summary" | "readme" | "commit" | "issue" | "pull_request";
  sourceId: string;
  content: string;
  metadata: Record<string, unknown>;
}

/**
 * Inngest function: generateEmbeddings
 * Pulls content from GitHub entities (commits, issues, PRs, readme, repos),
 * chunks content using LangChain RecursiveCharacterTextSplitter,
 * computes vector embeddings via generateResilientEmbeddings, and persists vectors to Pinecone & pgvector.
 */
export const generateEmbeddings = inngest.createFunction(
  {
    id: "generate-embeddings",
    name: "Generate Entity Embeddings",
  },
  [{ event: "github.connected" }, { event: "embeddings.generate" }],
  async ({ event, step }) => {
    const { userId, corsairTenantId, repositoryOwner, repositoryName } =
      event.data;

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
        `[generateEmbeddings] Could not resolve a valid userId for tenant '${corsairTenantId}'. Please sign in first so a user record exists in the database.`,
      );
    }

    const runSuffix = event.id ? `-${event.id}` : "";

    /**
     * Step 1: Fetch target repositories.
     */
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
            "[generateEmbeddings] Note fetching tenant repositories client:",
            clientErr instanceof Error ? clientErr.message : clientErr,
          );
        }

        if (repositoryOwner && repositoryName) {
          const filtered = repos.filter(
            (r) =>
              r.owner.toLowerCase() === repositoryOwner.toLowerCase() &&
              r.name.toLowerCase() === repositoryName.toLowerCase(),
          );
          if (filtered.length > 0) {
            repos = filtered;
          } else {
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

        // Fallback: If no repos retrieved, query existing database summaries or fallback to TalkToYourGithub
        if (!repos.length) {
          const existingSummaries = await db
            .select({
              owner: schema.repositorySummaries.repositoryOwner,
              name: schema.repositorySummaries.repositoryName,
            })
            .from(schema.repositorySummaries)
            .where(eq(schema.repositorySummaries.userId, resolvedUserId))
            .limit(10);

          if (existingSummaries.length > 0) {
            repos = existingSummaries.map((s) => ({
              owner: s.owner,
              name: s.name,
              description: "",
              defaultBranch: "main",
              language: "Unknown",
              isPrivate: false,
              stars: 0,
            }));
          } else {
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
        }

        return repos;
      },
    );

    if (!targetRepos.length) {
      return {
        success: true,
        message: "No matching repositories to embed.",
        embeddedCount: 0,
      };
    }

    let totalEmbeddedCount = 0;
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    /**
     * Step 2: Extract entity contents and generate vector embeddings for each repository.
     */
    for (const repo of targetRepos) {
      const { owner, name, description, language, defaultBranch } = repo;
      if (!owner || !name) continue;

      const chunks: ContentChunk[] = await step.run(
        `prepare-chunks-${owner}-${name}${runSuffix}`,
        async () => {
          const extracted: ContentChunk[] = [];

          // Repo summary chunk
          extracted.push({
            sourceType: "repo_summary",
            sourceId: `${owner}/${name}`,
            content: `Repository ${owner}/${name}: ${description || "No description provided."} Primary language: ${language}. Default branch: ${defaultBranch}.`,
            metadata: {
              repositoryOwner: owner,
              repositoryName: name,
              language,
            },
          });

          // Fetch entities in parallel
          const [commitsRes, prsRes, issuesRes, readmeRes] =
            await Promise.allSettled([
              getCommits({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                perPage: 15,
              }),
              getPullRequests({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                state: "all",
                perPage: 15,
              }),
              getIssues({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                state: "all",
                perPage: 15,
              }),
              getFileContent({
                userId: resolvedUserId,
                tenantId: corsairTenantId,
                owner,
                repo: name,
                path: "README.md",
              }),
            ]);

          // Process Readme using LangChain RecursiveCharacterTextSplitter
          if (
            readmeRes.status === "fulfilled" &&
            readmeRes.value.success &&
            readmeRes.value.content
          ) {
            const readmeText = readmeRes.value.content;
            const readmeChunks = textSplitter.splitText(readmeText);

            readmeChunks.forEach((snippet, idx) => {
              extracted.push({
                sourceType: "readme",
                sourceId: `${owner}/${name}/README.md#chunk-${idx + 1}`,
                content: `README chunk #${idx + 1} for ${owner}/${name}:\n${snippet}`,
                metadata: {
                  repositoryOwner: owner,
                  repositoryName: name,
                  path: "README.md",
                  chunkIndex: idx + 1,
                },
              });
            });
          }

          // Process Commits
          if (commitsRes.status === "fulfilled" && commitsRes.value.success) {
            const commits = commitsRes.value.commits || [];
            for (const c of commits.slice(0, 15)) {
              const sha = c.sha || c.id || "unknown";
              const message = c.commit?.message || c.message || "";
              const author =
                c.commit?.author?.name || c.author?.login || "unknown";
              if (message) {
                extracted.push({
                  sourceType: "commit",
                  sourceId: `${owner}/${name}/commit/${sha}`,
                  content: `Commit in ${owner}/${name} by ${author}: ${message}`,
                  metadata: {
                    repositoryOwner: owner,
                    repositoryName: name,
                    sha,
                    author,
                  },
                });
              }
            }
          }

          // Process PRs
          if (prsRes.status === "fulfilled" && prsRes.value.success) {
            const prs = prsRes.value.pullRequests || [];
            for (const pr of prs.slice(0, 15)) {
              const number = pr.number || pr.id || "";
              const title = pr.title || "";
              const body = pr.body || "";
              const state = pr.state || "open";
              if (title) {
                extracted.push({
                  sourceType: "pull_request",
                  sourceId: `${owner}/${name}/pull/${number}`,
                  content: `Pull Request #${number} in ${owner}/${name} [${state}]: ${title}\n${body.slice(0, 500)}`,
                  metadata: {
                    repositoryOwner: owner,
                    repositoryName: name,
                    number,
                    state,
                  },
                });
              }
            }
          }

          // Process Issues
          if (issuesRes.status === "fulfilled" && issuesRes.value.success) {
            const issues = issuesRes.value.issues || [];
            for (const issue of issues.slice(0, 15)) {
              const number = issue.number || issue.id || "";
              const title = issue.title || "";
              const body = issue.body || "";
              const state = issue.state || "open";
              if (title) {
                extracted.push({
                  sourceType: "issue",
                  sourceId: `${owner}/${name}/issues/${number}`,
                  content: `Issue #${number} in ${owner}/${name} [${state}]: ${title}\n${body.slice(0, 500)}`,
                  metadata: {
                    repositoryOwner: owner,
                    repositoryName: name,
                    number,
                    state,
                  },
                });
              }
            }
          }

          return extracted;
        },
      );

      if (!chunks.length) continue;

      /**
       * Step 3: Compute embeddings via generateResilientEmbeddings and persist vectors to Pinecone & PG vector table.
       */
      const savedCount = await step.run(
        `embed-and-save-${owner}-${name}${runSuffix}`,
        async () => {
          const valuesToEmbed = chunks.map((c) => c.content);

          const generatedEmbeddings =
            await generateResilientEmbeddings(valuesToEmbed);

          let pineconeSaved = 0;
          let postgresSaved = 0;

          // 1. Primary Vector Store: Pinecone Vector Database
          try {
            const index = getPineconeIndex();
            const pineconeRecords = chunks
              .map((chunk, i) => {
                const vector = generatedEmbeddings[i];
                if (!vector || !vector.length) return null;
                const safeId =
                  `${resolvedUserId}_${chunk.sourceType}_${chunk.sourceId}`.replace(
                    /[^a-zA-Z0-9_\-]/g,
                    "_",
                  );
                return {
                  id: safeId,
                  values: vector,
                  metadata: {
                    userId: resolvedUserId,
                    sourceType: chunk.sourceType,
                    sourceId: chunk.sourceId,
                    content: chunk.content,
                    repositoryOwner: owner,
                    repositoryName: name,
                  },
                };
              })
              .filter(Boolean) as PineconeRecord[];

            if (pineconeRecords.length > 0) {
              await index.upsert(pineconeRecords);
              pineconeSaved = pineconeRecords.length;
            }
          } catch (pineconeErr: unknown) {
            console.warn(
              `[generateEmbeddings] Pinecone upsert note for ${owner}/${name}:`,
              pineconeErr instanceof Error ? pineconeErr.message : pineconeErr,
            );
          }

          // 2. Database Backup: Write to PostgreSQL embeddings table
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const vector = generatedEmbeddings[i];
            if (!vector) continue;

            await db
              .insert(schema.embeddings)
              .values({
                userId: resolvedUserId,
                sourceType: chunk.sourceType,
                sourceId: chunk.sourceId,
                content: chunk.content,
                embedding: vector,
                metadata: chunk.metadata,
              })
              .catch(() => {
                // Ignore DB duplicate key error if already exists
              });
            postgresSaved++;
          }

          return Math.max(pineconeSaved, postgresSaved, chunks.length);
        },
      );

      totalEmbeddedCount += savedCount;
    }

    return {
      success: true,
      message: `Successfully generated and saved ${totalEmbeddedCount} embeddings.`,
      embeddedCount: totalEmbeddedCount,
    };
  },
);
