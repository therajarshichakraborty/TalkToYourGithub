Mystery solved — every repo is duplicated exactly. You have 27 unique repos × 2
= 54 rows (plus ~6 chaicodehq classroom repos = ~60 total).

Root Cause: Backfill Was Run Twice corsair_entities has no UNIQUE constraint on
(account_id, entity_id, entity_type). Each pnpm corsair setup --backfill call
inserts fresh rows without deduplicating. You ran it twice.

Fix 1 — Deduplicate Existing Rows (Run Once in Neon SQL Editor) sql -- Delete
duplicate entities, keeping the most recent row per entity_id DELETE FROM
corsair_entities WHERE id NOT IN ( SELECT DISTINCT ON (account_id, entity_id,
entity_type) id FROM corsair_entities ORDER BY account_id, entity_id,
entity_type, created_at DESC ); -- Verify: should now show ~27 repositories
SELECT entity_type, count(*) FROM corsair_entities GROUP BY entity_type; Fix 2 —
Always Query With DISTINCT (Defensive Approach) Even after the cleanup, protect
your TypeScript tools against future duplicates:

typescript // In your AI tools — deduplicate by repo name or entity_id const
allRepos = await tenant.github.db.repositories.search({ limit: 200 }); //
Deduplicate by the GitHub repo ID (numeric id in data) const seen = new
Set<string>(); const uniqueRepos = allRepos.filter((r: any) => { const key =
String(r.id); // GitHub's numeric repo ID if (seen.has(key)) return false;
seen.add(key); return true; }); Fix 3 — Don't Run --backfill Again Unless Needed
bash

# ✅ First-time setup only (no --backfill):

pnpm corsair setup --tenant=test_user --plugin=github api_key=$GITHUB_TOKEN

# ✅ Intentional re-sync (run the dedup SQL first, THEN backfill):

pnpm corsair setup --tenant=test_user --plugin=github api_key=$GITHUB_TOKEN
--backfill Run Fix 1 first, verify the count drops to ~33 (27 yours + ~6
classroom), then your tools and the progress.md count of "60 repos" becomes
accurate again.

11:06 PM

**Yes — it will cause real, visible problems.** Here's an honest breakdown:

## 🔴 Problems It Will Cause

| Feature                           | What breaks                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| **"List my repos"**               | AI returns every repo twice — looks broken to users                                   |
| **"How many repos do you have?"** | AI says 54 instead of 27 — wrong answer                                               |
| **Repo search / autocomplete**    | Duplicate options in dropdowns                                                        |
| **Embeddings (Day 14)**           | You'll embed every repo twice — wastes tokens, doubles cost, confuses semantic search |
| **AI context window**             | Duplicate data eats your token budget on every chat request                           |
| **`repository_summaries` table**  | Inngest job may generate duplicate summary rows for the same repo                     |

## 🟢 What Still Works Fine

- The app won't crash
- Auth, OAuth, actual GitHub API calls — unaffected
- The underlying repo data is correct, just doubled

---

## Fix It Now (30 seconds) — Before Building Anything Else

Run this once in the **Neon SQL editor**:

```sql
DELETE FROM corsair_entities
WHERE id NOT IN (
    SELECT DISTINCT ON (account_id, entity_id, entity_type) id
    FROM corsair_entities
    ORDER BY account_id, entity_id, entity_type, created_at DESC
);
```

Then verify:

```sql
SELECT entity_type, count(*) FROM corsair_entities GROUP BY entity_type;
-- repositories should now be ~33, not 60
```

**Do this before Day 4.** Every feature you build from here (tools, embeddings,
summaries, the chat UI) reads from `corsair_entities` — you want clean data
underneath all of it.

Viewed fix.md:78-83 Edited fix.md

Yes.

Day 4 is auth scaffolding — it doesn't touch `corsair_entities` at all. Fix the
duplicates before Day 7 (when you start building AI tools that read from it).
