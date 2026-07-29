import { inngest } from "./client";
import { generateRepoSummary } from "./functions/generate-repo-summary";
import { generateEmbeddings } from "./functions/generate-embeddings";
import { updateActivityLog } from "./functions/update-activity-log";
import { generateContinueWorking } from "./functions/generate-continue-working";

/**
 * Inngest client and registered functions array for Talk to Your GitHub.
 */
export { inngest };
export const functions = [
  generateRepoSummary,
  generateEmbeddings,
  updateActivityLog,
  generateContinueWorking,
];
