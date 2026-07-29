import { inngest } from "./client";
import { generateRepoSummary } from "./functions/generate-repo-summary";
import { generateEmbeddings } from "./functions/generate-embeddings";

/**
 * Inngest client and registered functions array for Talk to Your GitHub.
 */
export { inngest };
export const functions = [generateRepoSummary, generateEmbeddings];
