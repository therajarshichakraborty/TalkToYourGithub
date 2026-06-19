# 📋 Progress — Talk to Your GitHub

> **Project**: An AI-powered Next.js app that lets you "talk" to your GitHub data (repos, commits, etc.) via a chat interface, backed by a PostgreSQL database and the Corsair OAuth integration layer.

---

## ✅ Day 1 — Project Bootstrap & Tooling Setup

1. **Initialized the Next.js 16 project** with React 19, TypeScript, Tailwind CSS v4, and shadcn/ui component library (`components/ui/` ready to use).
2. **Set up PostgreSQL connection** via `lib/pool.ts` (using `pg` Pool) and wired up **Drizzle ORM** (`db/index.ts` + `drizzle.config.ts`) pointing to a pooled Neon/Postgres DB URL from `.env`.
3. **Integrated Corsair** (OAuth & token manager) with the GitHub plugin — configured in `server/corsair.ts` with KEK encryption key and `multiTenancy: false` mode.

---

## ✅ Day 2 — Database Schema & GitHub API Exploration

1. **Defined the Corsair DB schema** in `server/db/schema.ts` — four tables: `corsair_integrations`, `corsair_accounts`, `corsair_entities`, and `corsair_events` (stores OAuth accounts, synced entities, and event logs with JSONB payloads).
2. **Drizzle config updated** to include both `./db/schema.ts` and `./server/db/schema.ts` so migrations cover all tables in one run.
3. **Tested GitHub API via `server/playground.ts`** — successfully called `corsair.github.api.repositories.listCommits()` against a real repo (`therajarshichakraborty/ApexZero`) and logged all commit messages with a counter.

---

## 📁 Current Project Structure (compact)

```
takl-to-your-github/
├── app/                  # Next.js App Router (layout, globals, page)
├── components/ui/        # shadcn/ui component stubs
├── db/
│   ├── index.ts          # Drizzle ORM instance (uses pool)
│   └── schema.ts         # App-level schema (empty, to be filled)
├── server/
│   ├── corsair.ts        # Corsair client (GitHub OAuth + encryption)
│   ├── playground.ts     # GitHub API test script (listCommits)
│   └── db/schema.ts      # Corsair tables (integrations, accounts, entities, events)
├── lib/
│   ├── pool.ts           # pg Pool (DATABASE_URL_POOLED)
│   └── utils.ts          # Utility helpers
├── drizzle.config.ts     # Drizzle Kit config (postgresql, both schemas)
└── .env                  # DATABASE_URL_POOLED, CORSAIR_KEK, GitHub secrets
```






<!-- 
Here's a day-by-day breakdown that maps the 9-phase setup order in your blueprint onto a 20-day build, with extra days where the architecture genuinely needs them (OAuth + tenant provisioning, the AI chat loop, and the Inngest enrichment jobs are the parts most likely to eat unplanned time).

**Day 1 — Foundation**
Scaffold the Next.js App Router project, Tailwind, shadcn/ui. Provision your Neon Postgres instance. Install `corsair` and `@corsair-dev/github`, generate your KEK, run `npx corsair setup`, and confirm the 4 Corsair tables (`corsair_integrations`, `corsair_accounts`, `corsair_entities`, `corsair_events`) exist.

**Day 2 — Corsair client**
Write `lib/corsair/client.ts`, passing it the raw `pg Pool` (not Drizzle) with `multiTenancy: true`. This is the single entry point everything else calls through — get it solid before moving on.

**Day 3 — Your schema**
Write your 7 Drizzle tables (`users`, `github_connections`, `conversations`, `messages`, `repository_summaries`, `embeddings`, `activity_logs`). Run `drizzle-kit push` and verify they sit alongside Corsair's tables without conflict.

**Day 4 — Auth scaffolding**
Set up BetterAuth with GitHub OAuth. Build the sign-in page and callback route shell.

**Day 5 — Tenant provisioning**
Wire the OAuth callback to call `corsair.withTenant(userId).setupAccount({ githubToken })`, then persist `corsair_tenant_id` on your `users` row. Test with a real GitHub account end to end — this is the riskiest joint in the whole system, give it the full day.

**Day 6 — Backfill + webhooks**
Trigger the initial backfill, watch `corsair_entities` populate. Build `/api/webhooks/route.ts` using `processWebhook(corsair, ...)` and confirm a live webhook (e.g. a new commit) lands correctly.

**Day 7 — Prove the sync layer**
Write a throwaway test script hitting `corsair.github.db.branches.search({})`, `commits.search({})`, `pull_requests.search({})` against your real connected repo. Don't move to tools until this returns real data reliably.

**Day 8 — Read tools, part 1**
Build `get-branches.ts` and `get-commits.ts`. Test each as a plain function with a hardcoded userId — no AI SDK yet.

**Day 9 — Read tools, part 2**
Build `get-pull-requests.ts`, `get-issues.ts`, `get-repositories.ts`.

**Day 10 — Write/live-API tools**
Build `get-file-content.ts` (live API, uncached) and `create-issue.ts` (write operation). Confirm rate-limit behavior on the live path.

**Day 11 — Chat route**
Set up the AI SDK, `system-prompt.ts`, `tool-registry.ts` registering everything built so far, and `/api/chat/route.ts` with `streamText()`.

**Day 12 — Chat route hardening**
Test via curl end to end: verify tool calls actually hit `corsair.db`, streaming works, and tenant scoping holds. This is your integration-bug day — budget for it.

**Day 13 — Inngest: summaries**
Set up the Inngest client and `generate-repo-summary.ts`, triggered on `github.connected`, reading from `corsair.github.db.*` and writing to your `repository_summaries` table.

**Day 14 — Inngest: embeddings**
Build `generate-embeddings.ts` (pulls content from Corsair entities, embeds, writes to your pgvector `embeddings` table). Build `get-repository-summary.ts` and `get-project-memory.ts` tools that read your own tables.

**Day 15 — Inngest: activity**
Build `update-activity-log.ts` and `generate-continue-working.ts`, wired off webhook events into `activity_logs`.

**Day 16 — Minimal UI shell**
Sidebar, repo list, chat UI using `useChat()` and shadcn components. No polish yet — just wired and functional.

**Day 17 — Dashboard + repo pages**
Build the "Continue Working" dashboard reading `activity_logs` + `repository_summaries`. Wire up `repositories/[owner]/[name]/page.tsx`.

**Day 18 — Feature iteration**
PR review feature, summary display, tool-call rendering in the chat UI. This is where the product actually starts feeling finished.

**Day 19 — Multi-tenant QA**
Test with two+ separate user accounts to confirm `withTenant` isolation actually holds (no cross-user data leakage). Cover edge cases: no connected repo, webhook failure, rate-limit hit, empty backfill.

**Day 20 — Deploy**
Set all env vars on Vercel, deploy, smoke-test production against a real GitHub account, write a short README covering the Corsair vs. Drizzle table split for whoever touches this next.

A few honest flags: Day 5 (tenant provisioning) and Day 12 (chat route integration) are the two days most likely to overrun — if you're tight on time, that's where to steal buffer from Days 17–18 rather than from the Corsair sync work on Days 6–7, since a flaky sync layer breaks everything downstream of it. -->