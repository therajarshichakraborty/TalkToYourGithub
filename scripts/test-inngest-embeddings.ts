import "../lib/zod-polyfill";
import dotenv from "dotenv";
dotenv.config();

import { db } from "../db";
import * as schema from "../db/schema";
import { inngest } from "../inngest";
import { getRepositorySummary } from "../lib/tools/get-repository-summary";
import { getProjectMemory } from "../lib/tools/get-project-memory";

/**
 * Test script for Day 14: Inngest Embeddings and Local DB Memory Tools.
 */
async function main() {
  console.log("=== Testing Inngest Embeddings & Project Memory Tools ===");

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

  // 2. Test getRepositorySummary tool against local database
  console.log("\n📦 Testing getRepositorySummary tool...");
  const summaryResult = await getRepositorySummary({ userId });
  console.log("Summary Result:", JSON.stringify(summaryResult, null, 2));

  // 3. Dispatch 'embeddings.generate' event to Inngest
  console.log(
    "\n🚀 Dispatching 'embeddings.generate' event via Inngest client...",
  );
  try {
    const sendResult = await inngest.send({
      name: "embeddings.generate",
      data: {
        userId,
        corsairTenantId: tenantId,
      },
    });
    console.log("✅ Inngest event sent successfully:", sendResult);
  } catch (err) {
    console.error("❌ Failed to send Inngest event:", err);
  }

  // 4. Test getProjectMemory tool against embeddings table
  console.log("\n🔍 Testing getProjectMemory vector search tool...");
  const memoryResult = await getProjectMemory({
    userId,
    query: "repository commits branches pull requests summary",
    limit: 5,
  });

  console.log("Project Memory Result:", JSON.stringify(memoryResult, null, 2));

  console.log("\n✅ Day 14 Embeddings & Memory test completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during test script:", err);
  process.exit(1);
});
