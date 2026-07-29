import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ToolContextOptions } from "./helper";

/**
 * Options interface for getRepositorySummary tool.
 */
export interface GetRepositorySummaryOptions extends ToolContextOptions {
  owner?: string;
  repo?: string;
  repositoryOwner?: string;
  repositoryName?: string;
}

/**
 * Tool function: getRepositorySummary
 * Reads stored repository summaries directly from your own repositorySummaries database table.
 */
export async function getRepositorySummary(
  options: GetRepositorySummaryOptions,
) {
  if (!options.userId) {
    throw new Error(
      "[getRepositorySummary] Missing required parameter 'userId'.",
    );
  }

  const owner = options.owner || options.repositoryOwner;
  const repo = options.repo || options.repositoryName;

  try {
    if (owner && repo) {
      const results = await db
        .select()
        .from(schema.repositorySummaries)
        .where(
          and(
            eq(schema.repositorySummaries.userId, options.userId),
            eq(schema.repositorySummaries.repositoryOwner, owner),
            eq(schema.repositorySummaries.repositoryName, repo),
          ),
        )
        .orderBy(desc(schema.repositorySummaries.updatedAt))
        .limit(1);

      if (results.length > 0) {
        const summaryRecord = results[0];
        return {
          success: true,
          found: true,
          repositoryOwner: summaryRecord.repositoryOwner,
          repositoryName: summaryRecord.repositoryName,
          summary: summaryRecord.summary,
          generatedAt: summaryRecord.generatedAt,
          updatedAt: summaryRecord.updatedAt,
        };
      }

      return {
        success: true,
        found: false,
        repositoryOwner: owner,
        repositoryName: repo,
        message: `No generated summary found for repository ${owner}/${repo}.`,
      };
    }

    // Return all summaries for the user if owner/repo not specified
    const summaries = await db
      .select()
      .from(schema.repositorySummaries)
      .where(eq(schema.repositorySummaries.userId, options.userId))
      .orderBy(desc(schema.repositorySummaries.updatedAt));

    return {
      success: true,
      found: summaries.length > 0,
      count: summaries.length,
      summaries: summaries.map((s) => ({
        id: s.id,
        repositoryOwner: s.repositoryOwner,
        repositoryName: s.repositoryName,
        summary: s.summary,
        generatedAt: s.generatedAt,
      })),
    };
  } catch (error) {
    console.error("[getRepositorySummary] Error querying database:", error);
    return {
      success: false,
      found: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to read repository summary from database.",
    };
  }
}
