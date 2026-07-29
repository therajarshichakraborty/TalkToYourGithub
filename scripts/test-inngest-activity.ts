import dotenv from "dotenv";
dotenv.config();

import { db } from "../db";
import * as schema from "../db/schema";
import { inngest } from "../inngest";
import { eq, desc } from "drizzle-orm";

/**
 * Test script for Day 15: Inngest Activity Logging & Continue Working Dashboard Generation.
 */
async function main() {
  console.log("=== Testing Inngest Activity Log & Continue Working ===");

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

  // 2. Dispatch 'activity.update' event
  console.log("\n🚀 Dispatching 'activity.update' event via Inngest client...");
  try {
    const sendResult = await inngest.send({
      name: "activity.update",
      data: {
        userId,
        corsairTenantId: tenantId,
      },
    });
    console.log("✅ Inngest activity.update event sent:", sendResult);
  } catch (err) {
    console.error("❌ Failed to send activity.update event:", err);
  }

  // 3. Dispatch 'activity.continue_working' event
  console.log("\n🚀 Dispatching 'activity.continue_working' event via Inngest client...");
  try {
    const sendResult = await inngest.send({
      name: "activity.continue_working",
      data: {
        userId,
        corsairTenantId: tenantId,
      },
    });
    console.log("✅ Inngest activity.continue_working event sent:", sendResult);
  } catch (err) {
    console.error("❌ Failed to send activity.continue_working event:", err);
  }

  // 4. Query current activity logs from database table
  console.log("\n📋 Querying activityLogs table...");
  const logs = await db
    .select()
    .from(schema.activityLogs)
    .where(eq(schema.activityLogs.userId, userId))
    .orderBy(desc(schema.activityLogs.occurredAt))
    .limit(10);

  console.log(`Found ${logs.length} activity log entry(ies):`);
  logs.forEach((l, idx) => {
    console.log(
      `  [${idx + 1}] (${l.activityType}) ${l.title} - ${l.description}`,
    );
  });

  console.log("\n✅ Day 15 Activity Log test completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during activity test script:", err);
  process.exit(1);
});
