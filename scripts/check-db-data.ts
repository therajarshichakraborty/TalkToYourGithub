import dotenv from "dotenv";
dotenv.config();

import { db } from "../db/index";
import * as schema from "../db/schema";

async function main() {
  console.log("\n==========================================");
  console.log("📊 CHECKING DATABASE PERSISTENCE STATUS");
  console.log("==========================================\n");

  try {
    const convs = await db.select().from(schema.conversations);
    console.log(`💬 Conversations in DB: ${convs.length}`);

    const msgs = await db.select().from(schema.messages);
    console.log(`✉️  Messages in DB: ${msgs.length}`);

    const logs = await db.select().from(schema.activityLogs);
    console.log(`⚡ Activity Logs in DB: ${logs.length}`);

    const summaries = await db.select().from(schema.repositorySummaries);
    console.log(`📝 Repository Summaries in DB: ${summaries.length}`);

    const vectors = await db.select().from(schema.embeddings);
    console.log(`🧠 Vector Embeddings in DB: ${vectors.length}\n`);

    if (convs.length > 0) {
      console.log("Recent Conversation Sample:", {
        id: convs[0].id,
        repo: `${convs[0].repositoryOwner}/${convs[0].repositoryName}`,
        updatedAt: convs[0].updatedAt,
      });
    }

    if (logs.length > 0) {
      console.log("Recent Activity Log Sample:", {
        id: logs[0].id,
        type: logs[0].activityType,
        title: logs[0].title,
        occurredAt: logs[0].occurredAt,
      });
    }
  } catch (err: any) {
    console.error("DB check error:", err?.message || err);
  }
}

main().catch(console.error);
