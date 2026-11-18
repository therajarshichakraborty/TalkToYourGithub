import { inngest } from "./client";
import { generateContinueWorking } from "./functions/generate-continue-working";
import { generateEmbeddings } from "./functions/generate-embeddings";
import { generateRepoSummary } from "./functions/generate-repo-summary";
import { updateActivityLog } from "./functions/update-activity-log";

export { inngest };

export const functions = [
  generateRepoSummary,
  generateEmbeddings,
  updateActivityLog,
  generateContinueWorking,
];
