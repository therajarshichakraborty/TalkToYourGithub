import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { toErrorMessage } from "@/lib/github/client";

export interface GetRepositorySummaryOptions {
  userId: string;
  owner?: string;
  repo?: string;
}

export async function getRepositorySummary({
  userId,
  owner,
  repo,
}: GetRepositorySummaryOptions) {
  try {
    if (owner && repo) {
      const [row] = await db
        .select({
          summary: schema.repositorySummaries.summary,
          generatedAt: schema.repositorySummaries.generatedAt,
        })
        .from(schema.repositorySummaries)
        .where(
          and(
            eq(schema.repositorySummaries.userId, userId),
            eq(schema.repositorySummaries.repositoryOwner, owner),
            eq(schema.repositorySummaries.repositoryName, repo),
          ),
        )
        .orderBy(desc(schema.repositorySummaries.updatedAt))
        .limit(1);

      return row
        ? { success: true as const, found: true, repo: `${owner}/${repo}`, ...row }
        : { success: true as const, found: false, repo: `${owner}/${repo}` };
    }

    const rows = await db
      .select({
        owner: schema.repositorySummaries.repositoryOwner,
        name: schema.repositorySummaries.repositoryName,
        summary: schema.repositorySummaries.summary,
      })
      .from(schema.repositorySummaries)
      .where(eq(schema.repositorySummaries.userId, userId))
      .orderBy(desc(schema.repositorySummaries.updatedAt))
      .limit(15);

    return {
      success: true as const,
      found: rows.length > 0,
      summaries: rows.map((r) => ({
        repo: `${r.owner}/${r.name}`,
        summary: r.summary.slice(0, 280),
      })),
    };
  } catch (error) {
    return { success: false as const, found: false, error: toErrorMessage(error) };
  }
}
