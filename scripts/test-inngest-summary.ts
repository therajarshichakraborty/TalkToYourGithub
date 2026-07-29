import dotenv from "dotenv";
dotenv.config();

import { db } from "../db";
import * as schema from "../db/schema";
import { inngest } from "../inngest";
import { getCorsairTenantClient } from "../lib/tools/helper";
import { getRepositories } from "../lib/tools/get-repositories";
import { getCommits } from "../lib/tools/get-commits";
import { getBranches } from "../lib/tools/get-branches";
import { getPullRequests } from "../lib/tools/get-pull-requests";
import { getIssues } from "../lib/tools/get-issues";
import { getFileContent } from "../lib/tools/get-file-content";
import { generateText } from "ai";
import { chatModel } from "../features/chat";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("=== Testing Inngest Repository Summary Generation ===");

  // 1. Fetch first available user from DB
  const [targetUser] = await db.select().from(schema.user).limit(1);

  if (!targetUser) {
    console.error("❌ No user found in database.");
    process.exit(1);
  }

  console.log(
    `👤 Target User: ${targetUser.name} (${targetUser.id}), Tenant ID: ${targetUser.corsairTenantId}`,
  );

  const userId = targetUser.id;
  const tenantId = targetUser.corsairTenantId || undefined;

  // 2. Dispatch event to Inngest
  console.log(
    "\n🚀 Dispatching 'github.connected' event via Inngest client...",
  );
  try {
    const sendResult = await inngest.send({
      name: "github.connected",
      data: {
        userId,
        corsairTenantId: tenantId,
      },
    });
    console.log(`✅ Event sent successfully! Event IDs:`, sendResult.ids);
  } catch (err) {
    console.warn(
      `⚠️ Inngest event dispatch note:`,
      err instanceof Error ? err.message : err,
    );
  }

  // 3. Perform summary generation directly for CLI testing
  console.log("\n🤖 Generating repo summary via direct summary workflow...");

  try {
    const tenantInfo = await getCorsairTenantClient({ userId, tenantId });
    console.log(
      `✅ Corsair tenant client initialized for '${tenantInfo.tenantId}'`,
    );

    const reposResult = await getRepositories({
      userId,
      tenantId: tenantInfo.tenantId,
      perPage: 5,
    });

    if (!reposResult.success || !reposResult.repositories.length) {
      console.error("❌ No repositories found for tenant.");
      process.exit(1);
    }

    console.log(`📦 Found ${reposResult.repositories.length} repository(ies)`);

    for (const rawRepo of reposResult.repositories.slice(0, 2)) {
      const full_name = rawRepo.full_name || rawRepo.fullName || "";
      const parts = full_name.split("/");
      const owner = rawRepo.owner?.login || rawRepo.owner || parts[0] || "";
      const name = rawRepo.name || parts[1] || "";
      const description = rawRepo.description || "";
      const language = rawRepo.language || "TypeScript/JavaScript";

      console.log(`\n🔍 Gathering details for ${owner}/${name}...`);

      const [commitsRes, branchesRes, prsRes, issuesRes, readmeRes] =
        await Promise.allSettled([
          getCommits({ userId, tenantId, owner, repo: name, perPage: 5 }),
          getBranches({ userId, tenantId, owner, repo: name, perPage: 5 }),
          getPullRequests({
            userId,
            tenantId,
            owner,
            repo: name,
            state: "all",
            perPage: 5,
          }),
          getIssues({
            userId,
            tenantId,
            owner,
            repo: name,
            state: "all",
            perPage: 5,
          }),
          getFileContent({
            userId,
            tenantId,
            owner,
            repo: name,
            path: "README.md",
          }),
        ]);

      const commits =
        commitsRes.status === "fulfilled" && commitsRes.value.success
          ? commitsRes.value.commits
          : [];
      const branches =
        branchesRes.status === "fulfilled" && branchesRes.value.success
          ? branchesRes.value.branches
          : [];
      const prs =
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
          : "";

      console.log(
        `  - Commits: ${commits.length}, Branches: ${branches.length}, PRs: ${prs.length}, Issues: ${issues.length}`,
      );

      const prompt = `
Generate a clear, 2-3 paragraph summary of the following GitHub repository:

Repository: ${owner}/${name}
Description: ${description || "N/A"}
Primary Language: ${language}
Branches: ${branches.map((b) => b.name).join(", ") || "main"}
Open Issues: ${issues.length}
Pull Requests: ${prs.length}
Recent Commits:
${
  commits
    .slice(0, 3)
    .map((c) => `- ${c.commit?.message || c.message}`)
    .join("\n") || "None"
}

README Snippet:
${readme ? readme.slice(0, 1000) : "No README"}
      `.trim();

      console.log(
        ` ✨ Requesting AI summary generation via OpenRouter/chatModel...`,
      );
      const { text: summary } = await generateText({
        model: chatModel,
        system:
          "You are an expert technical documentation assistant. Generate a concise repository summary.",
        prompt,
      });

      console.log(`\n📝 Summary Generated:\n${summary}\n`);

      // Write to repository_summaries table
      const existing = await db
        .select()
        .from(schema.repositorySummaries)
        .where(
          and(
            eq(schema.repositorySummaries.userId, userId),
            eq(schema.repositorySummaries.repositoryOwner, owner),
            eq(schema.repositorySummaries.repositoryName, name),
          ),
        );

      const now = new Date();
      if (existing.length > 0) {
        await db
          .update(schema.repositorySummaries)
          .set({
            summary,
            updatedAt: now,
            generatedAt: now,
          })
          .where(eq(schema.repositorySummaries.id, existing[0].id));
        console.log(
          `💾 Updated repository_summaries record ID: ${existing[0].id}`,
        );
      } else {
        const [inserted] = await db
          .insert(schema.repositorySummaries)
          .values({
            userId,
            repositoryOwner: owner,
            repositoryName: name,
            summary,
            generatedAt: now,
          })
          .returning({ id: schema.repositorySummaries.id });
        console.log(
          `💾 Created repository_summaries record ID: ${inserted.id}`,
        );
      }
    }

    // 4. Verify contents of repository_summaries table
    const allSummaries = await db
      .select()
      .from(schema.repositorySummaries)
      .where(eq(schema.repositorySummaries.userId, userId));

    console.log(
      `\n📊 Total repository_summaries in DB for user: ${allSummaries.length}`,
    );
    allSummaries.forEach((s, idx) => {
      console.log(
        `  [${idx + 1}] ${s.repositoryOwner}/${s.repositoryName} (Generated: ${s.generatedAt})`,
      );
    });

    console.log(
      "\n🎉 Day 13 Inngest summary generation test completed successfully!",
    );
  } catch (err) {
    console.error("❌ Test error:", err);
    process.exit(1);
  }
}

main();
