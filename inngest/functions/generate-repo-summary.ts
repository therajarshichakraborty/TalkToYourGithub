import { generateText } from "ai";
import { chatModel } from "@/features/chat/openai";
import {
  buildSummaryPrompt,
  saveSummary,
  SUMMARY_SYSTEM_PROMPT,
} from "@/lib/summaries";
import { getCommits } from "@/lib/tools/get-commits";
import { getFileContent } from "@/lib/tools/get-file-content";
import { getRepositories } from "@/lib/tools/get-repositories";
import { inngest } from "../client";
import { resolveEventUser, SYNC_DEBOUNCE } from "../resolve-user";

const MAX_REPOS_PER_RUN = 10;

interface TargetRepo {
  owner: string;
  name: string;
  description: string;
  language: string | null;
}

export const generateRepoSummary = inngest.createFunction(
  {
    id: "generate-repo-summary",
    name: "Generate Repository Summary",
    debounce: SYNC_DEBOUNCE,
  },
  { event: "github.connected" },
  async ({ event, step }) => {
    const { repositoryOwner, repositoryName } = event.data;
    const { userId } = await step.run("resolve-user", () =>
      resolveEventUser(event.data),
    );

    const targets = await step.run("select-repositories", async () => {
      if (repositoryOwner && repositoryName) {
        return [
          {
            owner: repositoryOwner,
            name: repositoryName,
            description: "",
            language: null,
          },
        ] satisfies TargetRepo[];
      }
      const result = await getRepositories({
        userId,
        limit: MAX_REPOS_PER_RUN,
      });
      return result.repositories.map(
        (r): TargetRepo => ({
          owner: r.owner,
          name: r.name,
          description: r.description,
          language: r.language,
        }),
      );
    });

    const saved: string[] = [];

    for (const repo of targets) {
      const fullName = `${repo.owner}/${repo.name}`;

      const summary = await step.run(`summarize-${fullName}`, async () => {
        const target = { userId, owner: repo.owner, repo: repo.name };
        const [commits, readme] = await Promise.all([
          getCommits({ ...target, perPage: 5 }),
          getFileContent({ ...target, path: "README.md", maxChars: 1200 }),
        ]);

        const { text } = await generateText({
          model: chatModel,
          system: SUMMARY_SYSTEM_PROMPT,
          prompt: buildSummaryPrompt({
            fullName,
            description: repo.description,
            language: repo.language,
            commits: commits.commits.map((c) => c.message),
            readme: readme.success && readme.type === "file" ? readme.content : null,
          }),
          maxTokens: 220,
          temperature: 0.3,
        });
        return text.trim();
      });

      if (!summary) continue;

      await step.run(`save-${fullName}`, () =>
        saveSummary({ userId, owner: repo.owner, name: repo.name }, summary),
      );
      saved.push(fullName);
    }

    return { processed: saved.length, repositories: saved };
  },
);
