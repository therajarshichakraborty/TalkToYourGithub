import dotenv from "dotenv";
dotenv.config();

import { inngest } from "../inngest/client";

async function main() {
  console.log("🚀 Sending Inngest event 'embeddings.generate'...");

  const res = await inngest.send({
    name: "embeddings.generate",
    data: {
      repositoryOwner: "therajarshichakraborty",
      repositoryName: "Development",
    },
  });

  console.log("✅ Event sent successfully! Event IDs:", res.ids);
  console.log(
    "Check execution status in Inngest dashboard: http://localhost:8288",
  );
}

main().catch(console.error);
