import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { buildToolRegistry } from "@/features/chat/tool-registry";
import { pool } from "@/lib/pool";
import { getBranches } from "@/lib/tools/get-branches";
import { getRepositories } from "@/lib/tools/get-repositories";

let passed = 0;
let failed = 0;

function check(condition: boolean, name: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.error(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function idsFor(table: typeof schema.activityLogs | typeof schema.repositorySummaries, userId: string) {
  const rows = await db.select({ id: table.id }).from(table).where(eq(table.userId, userId));
  return new Set(rows.map((r) => r.id));
}

async function main() {
  const users = await db
    .select({ id: schema.user.id, name: schema.user.name })
    .from(schema.user)
    .limit(2);
  check(users.length >= 1, "at least one user exists");

  const unknown = await getRepositories({ userId: `missing-${Date.now()}` });
  check(!unknown.success, "unconnected user gets a clean error, not a crash");

  const tools = buildToolRegistry({ userId: users[0]?.id ?? "none", activeRepo: null });
  const noRepo = await tools.getCommits.execute(
    { limit: 5 },
    { toolCallId: "qa", messages: [] },
  );
  check(
    "success" in noRepo && noRepo.success === false,
    "repo-scoped tool without a repo returns an error object",
  );

  if (users[0]) {
    const branches = await getBranches({
      userId: users[0].id,
      owner: "this-owner-does-not-exist-qa",
      repo: "nope",
    });
    check(!branches.success && Array.isArray(branches.branches), "missing repo fails gracefully");
  }

  if (users.length === 2) {
    const [a, b] = users;
    for (const table of [schema.activityLogs, schema.repositorySummaries]) {
      const [idsA, idsB] = await Promise.all([idsFor(table, a.id), idsFor(table, b.id)]);
      const overlap = [...idsA].some((id) => idsB.has(id));
      check(!overlap, `no shared rows between users in ${table === schema.activityLogs ? "activity_logs" : "repository_summaries"}`);
    }
  } else {
    console.log("  SKIP  cross-user isolation (needs two users)");
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
