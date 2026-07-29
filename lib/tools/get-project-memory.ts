import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { ToolContextOptions } from "./helper";
import { embed } from "ai";
import { embeddingModel } from "@/features/chat/openrouter";
import { getPineconeIndex } from "@/lib/pinecone";

/**
 * Options interface for getProjectMemory tool.
 */
export interface GetProjectMemoryOptions extends ToolContextOptions {
  query: string;
  owner?: string;
  repo?: string;
  repositoryOwner?: string;
  repositoryName?: string;
  limit?: number;
  minSimilarity?: number;
}

/**
 * Interface representing a scored memory item returned by vector similarity search.
 */
export interface ProjectMemoryItem {
  id: string;
  sourceType: string;
  sourceId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown> | null;
}

/**
 * Helper function: computes cosine similarity between two numeric vector arrays.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Tool function: getProjectMemory
 * Performs vector semantic search on Pinecone Vector Database (with pgvector table fallback)
 * to retrieve relevant project context, code snippets, commits, issues, and PR history.
 */
export async function getProjectMemory(options: GetProjectMemoryOptions) {
  if (!options.userId) {
    throw new Error("[getProjectMemory] Missing required parameter 'userId'.");
  }
  if (!options.query || !options.query.trim()) {
    throw new Error("[getProjectMemory] Missing required parameter 'query'.");
  }

  const limit = options.limit || 5;
  const minSimilarity = options.minSimilarity ?? 0.1;
  const targetOwner = (options.owner || options.repositoryOwner)?.toLowerCase();
  const targetRepo = (options.repo || options.repositoryName)?.toLowerCase();

  try {
    // Generate query embedding vector
    const { embedding: queryVector } = await embed({
      model: embeddingModel,
      value: options.query,
    });

    // 1. Primary Vector Store: Pinecone Vector Search
    const pineconeMemories: ProjectMemoryItem[] = [];
    try {
      const index = getPineconeIndex();
      const queryResponse = await index.query({
        vector: queryVector,
        topK: limit * 2,
        includeMetadata: true,
        filter: {
          userId: options.userId,
        },
      });

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        for (const match of queryResponse.matches) {
          const score = match.score ?? 0;
          if (score < minSimilarity) continue;
          const meta = (match.metadata as Record<string, unknown>) || {};
          const recordOwner = (meta.repositoryOwner as string)?.toLowerCase();
          const recordRepo = (meta.repositoryName as string)?.toLowerCase();

          if (targetOwner && recordOwner && targetOwner !== recordOwner)
            continue;
          if (targetRepo && recordRepo && targetRepo !== recordRepo) continue;

          pineconeMemories.push({
            id: match.id,
            sourceType: (meta.sourceType as string) || "pinecone",
            sourceId: (meta.sourceId as string) || match.id,
            content: (meta.content as string) || "",
            similarity: Number(score.toFixed(4)),
            metadata: meta,
          });
        }
      }
    } catch (pineconeErr) {
      console.warn(
        "[getProjectMemory] Pinecone vector search note:",
        pineconeErr instanceof Error ? pineconeErr.message : pineconeErr,
      );
    }

    if (pineconeMemories.length > 0) {
      pineconeMemories.sort((a, b) => b.similarity - a.similarity);
      const topPinecone = pineconeMemories.slice(0, limit);
      return {
        success: true,
        source: "pinecone",
        count: topPinecone.length,
        query: options.query,
        memories: topPinecone,
      };
    }

    // 2. Fallback: Database pgvector embeddings table
    const storedEmbeddings = await db
      .select()
      .from(schema.embeddings)
      .where(eq(schema.embeddings.userId, options.userId));

    if (!storedEmbeddings || storedEmbeddings.length === 0) {
      return {
        success: true,
        count: 0,
        memories: [],
        message: "No project memory embeddings found for user.",
      };
    }

    const scoredMemories: ProjectMemoryItem[] = [];

    for (const record of storedEmbeddings) {
      const vector = record.embedding as number[] | null;
      if (!vector || !Array.isArray(vector)) continue;

      const metadata = (record.metadata as Record<string, unknown>) || {};
      const recordOwner = (metadata.repositoryOwner as string)?.toLowerCase();
      const recordRepo = (metadata.repositoryName as string)?.toLowerCase();

      if (targetOwner && recordOwner && targetOwner !== recordOwner) continue;
      if (targetRepo && recordRepo && targetRepo !== recordRepo) continue;

      const score = cosineSimilarity(queryVector, vector);
      if (score >= minSimilarity) {
        scoredMemories.push({
          id: record.id,
          sourceType: record.sourceType,
          sourceId: record.sourceId,
          content: record.content,
          similarity: Number(score.toFixed(4)),
          metadata,
        });
      }
    }

    scoredMemories.sort((a, b) => b.similarity - a.similarity);
    const topResults = scoredMemories.slice(0, limit);

    return {
      success: true,
      source: "pgvector_fallback",
      count: topResults.length,
      query: options.query,
      memories: topResults,
    };
  } catch (error) {
    console.error("[getProjectMemory] Error searching embeddings:", error);
    return {
      success: false,
      count: 0,
      memories: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to perform semantic search on embeddings table.",
    };
  }
}
