import type { PineconeRecord } from "@pinecone-database/pinecone";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { generateResilientEmbeddings } from "@/features/chat/openai";
import { getPineconeIndex } from "@/lib/pinecone";
import { RecursiveCharacterTextSplitter } from "@/lib/rag/text-splitter";
import { getCommits } from "@/lib/tools/get-commits";
import { getFileContent } from "@/lib/tools/get-file-content";
import { getIssues } from "@/lib/tools/get-issues";
import { getPullRequests } from "@/lib/tools/get-pull-requests";
import { getRepositories } from "@/lib/tools/get-repositories";
import { inngest } from "../client";
import { resolveEventUser, SYNC_DEBOUNCE } from "../resolve-user";

const MAX_REPOS_PER_RUN = 10;
const ITEMS_PER_KIND = 15;

interface ContentChunk {
  sourceType: "repo_summary" | "readme" | "commit" | "issue" | "pull_request";
  sourceId: string;
  content: string;
  metadata: Record<string, string | number>;
}

interface TargetRepo {
  owner: string;
  name: string;
  description: string;
  language: string | null;
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

async function buildChunks(
  userId: string,
  repo: TargetRepo,
): Promise<ContentChunk[]> {
  const { owner, name } = repo;
  const fullName = `${owner}/${name}`;
  const meta = { repositoryOwner: owner, repositoryName: name };
  const target = { userId, owner, repo: name, perPage: ITEMS_PER_KIND };

  const [commits, pulls, issues, readme] = await Promise.all([
    getCommits(target),
    getPullRequests({ ...target, state: "all" }),
    getIssues({ ...target, state: "all" }),
    getFileContent({ userId, owner, repo: name, path: "README.md", maxChars: 20000 }),
  ]);

  const chunks: ContentChunk[] = [
    {
      sourceType: "repo_summary",
      sourceId: fullName,
      content: `Repository ${fullName}: ${repo.description || "no description"}. Language: ${repo.language ?? "unknown"}.`,
      metadata: meta,
    },
  ];

  if (readme.success && readme.type === "file" && readme.content) {
    splitter.splitText(readme.content).forEach((text, i) => {
      chunks.push({
        sourceType: "readme",
        sourceId: `${fullName}/README.md#${i + 1}`,
        content: `README of ${fullName}:\n${text}`,
        metadata: { ...meta, chunkIndex: i + 1 },
      });
    });
  }

  for (const c of commits.commits) {
    chunks.push({
      sourceType: "commit",
      sourceId: `${fullName}/commit/${c.sha}`,
      content: `Commit ${c.sha} in ${fullName} by ${c.author} on ${c.date.slice(0, 10)}: ${c.message}`,
      metadata: { ...meta, sha: c.sha },
    });
  }

  for (const pr of pulls.pullRequests) {
    chunks.push({
      sourceType: "pull_request",
      sourceId: `${fullName}/pull/${pr.number}`,
      content: `PR #${pr.number} in ${fullName} [${pr.merged ? "merged" : pr.state}] by ${pr.author}: ${pr.title}`,
      metadata: { ...meta, number: pr.number },
    });
  }

  for (const issue of issues.issues) {
    chunks.push({
      sourceType: "issue",
      sourceId: `${fullName}/issues/${issue.number}`,
      content: `Issue #${issue.number} in ${fullName} [${issue.state}] by ${issue.author}: ${issue.title}`,
      metadata: { ...meta, number: issue.number },
    });
  }

  return chunks;
}

async function persistChunks(
  userId: string,
  repo: TargetRepo,
  chunks: ContentChunk[],
): Promise<number> {
  const vectors = await generateResilientEmbeddings(chunks.map((c) => c.content));

  const records: PineconeRecord[] = chunks.flatMap((chunk, i) =>
    vectors[i]?.length
      ? [
          {
            id: `${userId}_${chunk.sourceType}_${chunk.sourceId}`.replace(
              /[^a-zA-Z0-9_-]/g,
              "_",
            ),
            values: vectors[i],
            metadata: {
              userId,
              sourceType: chunk.sourceType,
              sourceId: chunk.sourceId,
              content: chunk.content,
              repositoryOwner: repo.owner,
              repositoryName: repo.name,
            },
          },
        ]
      : [],
  );

  try {
    if (records.length) await getPineconeIndex().upsert(records);
  } catch (error) {
    console.warn(`[embeddings] Pinecone upsert skipped for ${repo.owner}/${repo.name}`, error);
  }

  await db.delete(schema.embeddings).where(
    and(
      eq(schema.embeddings.userId, userId),
      inArray(
        schema.embeddings.sourceId,
        chunks.map((c) => c.sourceId),
      ),
    ),
  );
  await db.insert(schema.embeddings).values(
    chunks.map((chunk, i) => ({
      userId,
      sourceType: chunk.sourceType,
      sourceId: chunk.sourceId,
      content: chunk.content,
      embedding: vectors[i] ?? null,
      metadata: chunk.metadata,
    })),
  );

  return chunks.length;
}

export const generateEmbeddings = inngest.createFunction(
  {
    id: "generate-embeddings",
    name: "Generate Entity Embeddings",
    debounce: SYNC_DEBOUNCE,
  },
  [{ event: "github.connected" }, { event: "embeddings.generate" }],
  async ({ event, step }) => {
    const { repositoryOwner, repositoryName } = event.data;
    const { userId } = await step.run("resolve-user", () =>
      resolveEventUser(event.data),
    );

    const targets = await step.run("select-repositories", async () => {
      if (repositoryOwner && repositoryName) {
        return [
          { owner: repositoryOwner, name: repositoryName, description: "", language: null },
        ] satisfies TargetRepo[];
      }
      const result = await getRepositories({ userId, limit: MAX_REPOS_PER_RUN });
      return result.repositories.map(
        (r): TargetRepo => ({
          owner: r.owner,
          name: r.name,
          description: r.description,
          language: r.language,
        }),
      );
    });

    let embedded = 0;

    for (const repo of targets) {
      embedded += await step.run(`embed-${repo.owner}/${repo.name}`, async () => {
        const chunks = await buildChunks(userId, repo);
        return chunks.length ? persistChunks(userId, repo, chunks) : 0;
      });
    }

    return { embedded };
  },
);
