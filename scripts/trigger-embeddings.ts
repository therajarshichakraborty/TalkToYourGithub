import "../lib/zod-polyfill";
import dotenv from "dotenv";
dotenv.config();

import { inngest } from "../inngest/client";
import { db } from "../db";
import * as schema from "../db/schema";

async function main() {
  console.log("🚀 Sending Inngest event 'embeddings.generate'...");

  const [targetUser] = await db.select().from(schema.user).limit(1);
  const userId = targetUser?.id;
  const corsairTenantId = targetUser?.corsairTenantId || undefined;

  const res = await inngest.send({
    name: "embeddings.generate",
    data: {
      userId,
      corsairTenantId,
      repositoryOwner: "therajarshichakraborty",
      repositoryName: "Development",
    },
  });

  console.log("✅ Event sent successfully! Event IDs:", res.ids);
  console.log(
    "Check execution status in Inngest dashboard: http://localhost:8288",
  );
  process.exit(0);
}

main().catch(console.error);

