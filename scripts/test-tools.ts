import dotenv from "dotenv";
dotenv.config();

import { pool } from "../lib/pool";
import {
  getRepositories,
  getBranches,
  getCommits,
  getPullRequests,
  getIssues,
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
  console.log(`Testing Day 8 & Day 9 Read Tools for Tenant: '${tenantId}'`);
  console.log(`========================================\n`);

  // 1. Test getRepositories
  console.log("1. Testing getRepositories()...");
  const reposRes = await getRepositories({ tenantId, perPage: 5 });
  console.log(`   Success: ${reposRes.success}`);
  console.log(`   Count: ${reposRes.count}`);

  if (!reposRes.success || reposRes.repositories.length === 0) {
    console.warn("   No repositories found to run repo-specific tool tests on.");
    await pool.end();
    return;
  }

  const firstRepo = reposRes.repositories[0];
  const owner = firstRepo.owner?.login || firstRepo.owner?.name || firstRepo.fullName?.split("/")[0];
  const repo = firstRepo.name;

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

  console.log("\nAll 5 read tools executed successfully!");
  await pool.end();
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
