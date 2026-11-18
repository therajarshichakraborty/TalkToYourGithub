import "dotenv/config";
import { pool } from "../lib/pool";
import {
  getBranches,
  getCommits,
  getFileContent,
  getIssues,
  getPullRequests,
  getRepositories,
} from "../lib/tools";

async function resolveUserId(): Promise<string> {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg;

  const { rows } = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM account WHERE provider_id = 'github' LIMIT 1`,
  );
  if (!rows.length) throw new Error("No GitHub-connected user found.");
  return rows[0].user_id;
}

async function main() {
  const userId = await resolveUserId();
  console.log(`Smoke-testing read tools for user ${userId}`);

  const repos = await getRepositories({ userId, force: true });
  if (!repos.success) throw new Error(repos.error);
  console.log(`repositories: ${repos.count}`);

  const first = repos.repositories[0];
  if (!first) return;

  const target = { userId, owner: first.owner, repo: first.name };
  const [branches, commits, pulls, issues, root] = await Promise.all([
    getBranches(target),
    getCommits({ ...target, perPage: 5 }),
    getPullRequests({ ...target, state: "all", perPage: 5 }),
    getIssues({ ...target, state: "all", perPage: 5 }),
    getFileContent(target),
  ]);

  console.table({
    repo: first.fullName,
    branches: branches.branches.length,
    commits: commits.commits.length,
    pullRequests: pulls.pullRequests.length,
    issues: issues.issues.length,
    rootListing: root.success && root.type === "directory" ? root.items.length : 0,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
