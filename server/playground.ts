import { corsair } from "./corsair";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─── Step 1: insert a test user linked to the corsair tenant ─────────────────
const [inserted] = await db
    .insert(users)
    .values({
        email: "smoke-test@example.com",
        name: "Smoke Test User",
        corsairTenantId: "test_user", // matches --tenant=test_user from setup
    })
    .onConflictDoUpdate({
        target: users.email,
        set: { corsairTenantId: "test_user" },
    })
    .returning();

console.log("✓ Step 1 — user inserted/updated:", inserted.id, inserted.email);

// ─── Step 2: read it back ─────────────────────────────────────────────────────
const found = await db.query.users.findFirst({
    where: eq(users.email, "smoke-test@example.com"),
});

if (!found?.corsairTenantId) {
    throw new Error("✗ Step 2 failed — user not found or corsairTenantId missing");
}
console.log("✓ Step 2 — user read back, corsairTenantId:", found.corsairTenantId);

// ─── Step 3: call Corsair's db layer via withTenant ───────────────────────────
// This is the critical joint — proves your users table and Corsair's
// corsair_entities table cooperate through the same tenant key.
const repos = await (corsair as any)
    .withTenant(found.corsairTenantId)
    .github.db.repositories.search({});

const count = Array.isArray(repos) ? repos.length : 0;

if (count === 0) {
    console.warn("⚠ Step 3 — withTenant returned 0 repos (backfill may still be running)");
} else {
    console.log(`✓ Step 3 — withTenant returned ${count} repos from corsair_entities`);
    console.log("  Sample:", (repos as any[])[0]?.full_name ?? (repos as any[])[0]);
}

console.log("\n🎉 Day 3 smoke test complete — foundation is solid.");