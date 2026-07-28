import dotenv from "dotenv";
dotenv.config();

import { pool } from "../lib/pool";
import {
  getRepositories,
  getBranches,
  getCommits,
  getPullRequests,
  getIssues,
  getFileContent,
  createIssue,
} from "../lib/tools";

async function main() {
  let tenantId = process.argv[2];

  if (!tenantId) {
    console.log("No tenant ID provided as argument. Looking up first available tenant from corsair_accounts...");
    const res = await pool.query(`SELECT tenant_id FROM corsair_accounts LIMIT 1`);
    if (res.rows.length === 0) {
      console.error("Error: No tenants found in corsair_accounts database. Please provision a tenant first.");
      process.exit(1);
    }
    tenantId = res.rows[0].tenant_id;
  }

  console.log(`========================================`);
  console.log(`Testing All Tools (Read & Live/Write) for Tenant: '${tenantId}'`);
  console.log(`========================================\n`);

  // 1. Test getRepositories
  console.log("1. Testing getRepositories()...");
  const reposRes = await getRepositories({ tenantId, perPage: 5 });
  console.log(`   Success: ${reposRes.success}`);
  console.log(`   Count: ${reposRes.count}`);

  if (!reposRes.success || !reposRes.repositories || reposRes.repositories.length === 0) {
    console.warn("   No repositories found to run repo-specific tool tests on.");
    await pool.end();
    return;
  }

  const firstRepo = reposRes.repositories[0];
  const owner = (firstRepo as Record<string, unknown>).fullName
    ? ((firstRepo as Record<string, unknown>).fullName as string).split("/")[0]
    : "owner";
  const repo = (firstRepo as Record<string, unknown>).name as string;

  if (!owner || !repo) {
    console.warn("   Could not determine owner/repo from first repository object.");
    await pool.end();
    return;
  }

  console.log(`\nUsing repository '${owner}/${repo}' for repo-level tools:\n`);

  // 2. Test getBranches
  console.log("2. Testing getBranches()...");
  const branchesRes = await getBranches({ owner, repo, tenantId });
  console.log(`   Success: ${branchesRes.success}`);
  console.log(`   Branches count: ${branchesRes.count}`);

  // 3. Test getCommits
  console.log("3. Testing getCommits()...");
  const commitsRes = await getCommits({ owner, repo, perPage: 5, tenantId });
  console.log(`   Success: ${commitsRes.success}`);
  console.log(`   Commits count: ${commitsRes.count}`);

  // 4. Test getPullRequests
  console.log("4. Testing getPullRequests()...");
  const prsRes = await getPullRequests({ owner, repo, state: "all", perPage: 5, tenantId });
  console.log(`   Success: ${prsRes.success}`);
  console.log(`   PRs count: ${prsRes.count}`);

  // 5. Test getIssues
  console.log("5. Testing getIssues()...");
  const issuesRes = await getIssues({ owner, repo, state: "all", perPage: 5, tenantId });
  console.log(`   Success: ${issuesRes.success}`);
  console.log(`   Issues count: ${issuesRes.count}`);

  // 6. Test getFileContent (Live API)
  console.log("6. Testing getFileContent() (Live API)...");
  const fileRes = await getFileContent({ owner, repo, path: "README.md", tenantId });
  console.log(`   Success: ${fileRes.success}`);
  if (fileRes.success) {
    console.log(`   File Type: ${fileRes.type}`);
    console.log(`   File Size: ${fileRes.size} bytes`);
  } else {
    console.log(`   Note: ${fileRes.error}`);
  }

  // 7. Test createIssue (Live API Write - Optional dry run or live test)
  console.log("7. Testing createIssue() (Live API Write)...");
  const runWriteTest = process.argv.includes("--write");
  if (runWriteTest) {
    const issueRes = await createIssue({
      owner,
      repo,
      title: `[Test] Automated Tool Test - ${new Date().toISOString()}`,
      body: "This issue was automatically created by Day 10 live-write tool test.",
      tenantId,
    });
    console.log(`   Success: ${issueRes.success}`);
    if (issueRes.success) {
      console.log(`   Created Issue #${issueRes.issue?.number}: ${issueRes.issue?.htmlUrl}`);
    } else {
      console.log(`   Note: ${issueRes.error}`);
    }
  } else {
    console.log("   (Skipping live write test. Pass '--write' flag to run issue creation write test).");
  }

  console.log("\nAll tool functions tested!");
  await pool.end();
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
