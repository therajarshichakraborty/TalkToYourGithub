import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

interface SummaryKey {
  userId: string;
  owner: string;
  name: string;
}

function whereKey({ userId, owner, name }: SummaryKey) {
  return and(
    eq(schema.repositorySummaries.userId, userId),
    eq(schema.repositorySummaries.repositoryOwner, owner),
    eq(schema.repositorySummaries.repositoryName, name),
  );
}

export async function findSummary(key: SummaryKey) {
  const [row] = await db
    .select({
      id: schema.repositorySummaries.id,
      summary: schema.repositorySummaries.summary,
      generatedAt: schema.repositorySummaries.generatedAt,
    })
    .from(schema.repositorySummaries)
    .where(whereKey(key))
    .orderBy(desc(schema.repositorySummaries.updatedAt))
    .limit(1);
  return row ?? null;
}

export async function saveSummary(key: SummaryKey, summary: string) {
  const now = new Date();
  const existing = await findSummary(key);

  if (existing) {
    await db
      .update(schema.repositorySummaries)
      .set({ summary, generatedAt: now, updatedAt: now })
      .where(eq(schema.repositorySummaries.id, existing.id));
    return existing.id;
  }

  const [created] = await db
    .insert(schema.repositorySummaries)
    .values({
      userId: key.userId,
      repositoryOwner: key.owner,
      repositoryName: key.name,
      summary,
      generatedAt: now,
    })
    .returning({ id: schema.repositorySummaries.id });
  return created.id;
}

export const SUMMARY_SYSTEM_PROMPT =
  "You summarize GitHub repositories for engineers. Two short paragraphs of plain prose, max 120 words total: (1) what it does and for whom; (2) stack and current activity. Only state facts present in the input. No headings, lists or preamble.";

export interface SummaryInput {
  fullName: string;
  description?: string | null;
  language?: string | null;
  commits: string[];
  readme?: string | null;
}

export function buildSummaryPrompt(input: SummaryInput): string {
  return [
    `Repo: ${input.fullName}`,
    input.description ? `Description: ${input.description}` : null,
    input.language ? `Language: ${input.language}` : null,
    input.commits.length
      ? `Recent commits:\n${input.commits.slice(0, 5).map((c) => `- ${c}`).join("\n")}`
      : null,
    `README:\n${input.readme ? input.readme.slice(0, 1200) : "none"}`,
  ]
    .filter(Boolean)
    .join("\n");
}
