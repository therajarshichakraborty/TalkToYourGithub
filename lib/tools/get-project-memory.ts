import { embed } from "ai";
import { and, eq, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { embeddingModel } from "@/features/chat/openai";
import { toErrorMessage } from "@/lib/github/client";
import { getPineconeIndex } from "@/lib/pinecone";

export interface GetProjectMemoryOptions {
  userId: string;
  query: string;
  owner?: string;
  repo?: string;
  limit?: number;
  minSimilarity?: number;
}

interface SearchScope {
  userId: string;
  owner?: string;
  repo?: string;
  limit: number;
  minSimilarity: number;
}

interface Memory {
  type: string;
  score: number;
  content: string;
}

const SNIPPET_CHARS = 400;
const FALLBACK_SCAN_LIMIT = 500;

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

const sameText = (a: unknown, b: string | undefined) =>
  !b || (typeof a === "string" && a.toLowerCase() === b.toLowerCase());

async function searchPinecone(
  vector: number[],
  { userId, owner, repo, limit, minSimilarity }: SearchScope,
): Promise<Memory[]> {
  const filter: Record<string, string> = { userId };
  if (owner) filter.repositoryOwner = owner;
  if (repo) filter.repositoryName = repo;

  const response = await getPineconeIndex().query({
    vector,
    topK: limit * 3,
    includeMetadata: true,
    filter,
  });

  return (response.matches ?? [])
    .filter((m) => {
      const meta = m.metadata ?? {};
      return (
        (m.score ?? 0) >= minSimilarity &&
        meta.userId === userId &&
        sameText(meta.repositoryOwner, owner) &&
        sameText(meta.repositoryName, repo)
      );
    })
    .map((m) => ({
      type: String(m.metadata?.sourceType ?? "memory"),
      score: Number((m.score ?? 0).toFixed(3)),
      content: String(m.metadata?.content ?? ""),
    }));
}

async function searchDatabase(
  vector: number[],
  { userId, owner, repo, minSimilarity }: SearchScope,
): Promise<Memory[]> {
  const conditions: SQL[] = [eq(schema.embeddings.userId, userId)];
  if (owner) {
    conditions.push(ilike(sql`${schema.embeddings.metadata}->>'repositoryOwner'`, owner));
  }
  if (repo) {
    conditions.push(ilike(sql`${schema.embeddings.metadata}->>'repositoryName'`, repo));
  }

  const rows = await db
    .select({
      sourceType: schema.embeddings.sourceType,
      content: schema.embeddings.content,
      embedding: schema.embeddings.embedding,
    })
    .from(schema.embeddings)
    .where(and(...conditions))
    .limit(FALLBACK_SCAN_LIMIT);

  return rows.flatMap((row) => {
    if (!Array.isArray(row.embedding)) return [];
    const score = cosineSimilarity(vector, row.embedding as number[]);
    return score >= minSimilarity
      ? [{ type: row.sourceType, score: Number(score.toFixed(3)), content: row.content }]
      : [];
  });
}

export async function getProjectMemory({
  userId,
  query,
  owner,
  repo,
  limit = 5,
  minSimilarity = 0.1,
}: GetProjectMemoryOptions) {
  if (!query.trim()) {
    return { success: false as const, error: "A search query is required.", memories: [] };
  }

  try {
    const { embedding } = await embed({ model: embeddingModel, value: query });
    const scope: SearchScope = { userId, owner, repo, limit, minSimilarity };

    let memories: Memory[] = [];
    try {
      memories = await searchPinecone(embedding, scope);
    } catch (error) {
      console.warn("[memory] Pinecone unavailable, using database", toErrorMessage(error));
    }
    if (memories.length === 0) {
      memories = await searchDatabase(embedding, scope);
    }

    const top = memories
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((m) => ({ ...m, content: m.content.slice(0, SNIPPET_CHARS) }));

    return { success: true as const, count: top.length, memories: top };
  } catch (error) {
    console.error("[memory] search failed", error);
    return { success: false as const, error: toErrorMessage(error), memories: [] };
  }
}
