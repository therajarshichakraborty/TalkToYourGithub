import { inngest } from "./client";
import { generateRepoSummary } from "./functions/generate-repo-summary";

export { inngest };
export const functions = [generateRepoSummary];
