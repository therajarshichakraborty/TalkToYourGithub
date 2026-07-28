import dotenv from "dotenv";
dotenv.config();

import { corsair } from "../server/corsair";
import { pool } from "../lib/pool";

async function main() {
  const tenantId = process.argv[2];

  if (!tenantId) {
    console.log("\nUsage: npx tsx scripts/test-sync.ts <tenant_id>\n");
    console.log("Querying existing tenants from corsair_accounts table...");

    const tenantRes = await pool.query(
      `SELECT tenant_id FROM corsair_accounts LIMIT 1`
    );

    if (tenantRes.rows.length === 0) {
      console.error("No tenants found in corsair_accounts table. Please provision a tenant first.");
      process.exit(1);
    }

    const fallbackTenant = tenantRes.rows[0].tenant_id;
    console.log(`Using existing tenant_id: '${fallbackTenant}'\n`);
    await runTestForTenant(fallbackTenant);
  } else {
    await runTestForTenant(tenantId);
  }

  await pool.end();
}

async function runTestForTenant(tenantId: string) {
  console.log(`========================================`);
  console.log(`Testing Corsair Integration for Tenant: ${tenantId}`);
  console.log(`========================================\n`);

  const tenant = corsair.withTenant(tenantId);

  if (!tenant?.github?.api) {
    console.error("Error: corsair.github.api is undefined for this tenant instance.");
    return;
  }

  try {
    console.log("1. Fetching Repositories via Corsair API (tenant.github.api.repositories.list)...");
    const repos = await tenant.github.api.repositories.list({ perPage: 10 });
    console.log(`   Found ${repos.length} repositories.`);

    if (repos.length > 0) {
      const firstRepo = repos[0];
      const owner = firstRepo.owner?.login || firstRepo.owner?.name || firstRepo.full_name?.split("/")[0];
      const repoName = firstRepo.name;

      console.log(`\nTesting repo-specific queries on: '${owner}/${repoName}'`);

      console.log("2. Fetching Branches (tenant.github.api.repositories.listBranches)...");
      try {
        const branches = await tenant.github.api.repositories.listBranches({ owner, repo: repoName });
        console.log(`   Found ${branches.length} branches.`);
      } catch (err: any) {
        console.warn(`   Branch fetch note: ${err?.message || err}`);
      }

      console.log("3. Fetching Commits (tenant.github.api.repositories.listCommits)...");
      try {
        const commits = await tenant.github.api.repositories.listCommits({ owner, repo: repoName, perPage: 5 });
        console.log(`   Found ${commits.length} commits.`);
      } catch (err: any) {
        console.warn(`   Commit fetch note: ${err?.message || err}`);
      }

      console.log("4. Fetching Pull Requests (tenant.github.api.pullRequests.list)...");
      try {
        const prs = await tenant.github.api.pullRequests.list({ owner, repo: repoName, perPage: 5 });
        console.log(`   Found ${prs.length} pull requests.`);
      } catch (err: any) {
        console.warn(`   PR fetch note: ${err?.message || err}`);
      }

      console.log("5. Fetching Issues (tenant.github.api.issues.list)...");
      try {
        const issues = await tenant.github.api.issues.list({ owner, repo: repoName, perPage: 5 });
        console.log(`   Found ${issues.length} issues.`);
      } catch (err: any) {
        console.warn(`   Issue fetch note: ${err?.message || err}`);
      }
    }

    console.log("\n6. Checking Local DB Synced Entities (corsair_entities table)...");
    const dbRes = await pool.query(
      `SELECT entity_type, COUNT(*)::int as count FROM corsair_entities WHERE account_id IN (SELECT id FROM corsair_accounts WHERE tenant_id = $1) GROUP BY entity_type`,
      [tenantId]
    );

    console.log("   Synced DB entities by type:");
    if (dbRes.rows.length === 0) {
      console.log("   (No rows populated in corsair_entities yet)");
    } else {
      for (const row of dbRes.rows) {
        console.log(`   - ${row.entity_type}: ${row.count}`);
      }
    }
  } catch (err: unknown) {
    console.error("Error testing Corsair sync layer:", err);
  }
}

main().catch((err) => {
  console.error("Script execution failed:", err);
  process.exit(1);
});
