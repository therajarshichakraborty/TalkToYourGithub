# 🛡️ Production-Grade Setup: Corsair + Neon + Drizzle ORM

### _The definitive reference for the `takl-to-your-github` project_

> Written from real experience building this exact stack. Covers the mental
> model, every step, every gotcha, every error message you will encounter, and
> the precise order of operations that works — nothing is hand-wavy.

---

## 📖 Table of Contents

1. [The Mental Model — Read This First](#-the-mental-model--read-this-first)
2. [Architecture Overview](#-architecture-overview)
3. [The Golden Rule — Two Systems, Two Namespaces](#️-the-golden-rule--two-systems-two-namespaces)
4. [Step 1 — Install Dependencies](#-step-1--install-dependencies)
5. [Step 2 — Generate Your KEK](#-step-2--generate-your-kek)
6. [Step 3 — Environment Variables](#-step-3--environment-variables)
7. [Step 4 — Create the File Structure](#-step-4--create-the-file-structure)
8. [Step 5 — Migrate the Database (Corsair's 4 Tables)](#️-step-5--migrate-the-database-corsairs-4-tables)
9. [Step 6 — Push Your App Schema](#-step-6--push-your-app-schema)
10. [Step 7 — Provision a Tenant & Smoke Test](#-step-7--provision-a-tenant--smoke-test)
11. [Step 8 — End-to-End Wiring Test](#-step-8--end-to-end-wiring-test)
12. [The API Pattern — Always Use `withTenant()`](#-the-api-pattern--always-use-withtenant)
13. [Production Tenant Provisioning (OAuth Callback)](#-production-tenant-provisioning-oauth-callback)
14. [Webhook Handling](#-webhook-handling)
15. [Common Errors & Fixes](#-common-errors--fixes)
16. [Security & Ops Runbook](#-security--ops-runbook)
17. [Final Checklist](#-final-checklist)
18. [What Lives Where (Final State)](#️-what-lives-where-final-state)
19. [Quick Reference — Command Cheat Sheet](#-quick-reference--command-cheat-sheet)

---

## 🧠 The Mental Model — Read This First

Before writing a single line of code, understand these three facts. They answer
90% of the questions you'll have while building.

### Fact 1 — Corsair is a credential vault with a sync engine, not just an OAuth library

Corsair does three separate things that look like one thing:

| What                   | What it actually does                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Credential storage** | Encrypts OAuth tokens / API keys at rest using a per-account DEK, encrypted with your master KEK                                                                    |
| **GitHub API proxy**   | `tenant.github.api.*` — proxies live GitHub API calls, injecting the stored token automatically                                                                     |
| **Sync engine**        | `tenant.github.db.*` — maintains a local copy of repos, commits, PRs, issues, branches in `corsair_entities` (synced from GitHub webhooks and the initial backfill) |

You interact with all three through the same `corsair` instance, scoped by
tenant. The local sync layer is what makes the chat feel fast — instead of
hitting GitHub's API on every question, your AI tools query `corsair_entities`
directly (no rate limits, sub-millisecond reads).

### Fact 2 — The database has two completely separate ownership zones

```
Your Neon DB (one database, 11 tables total)
│
├── ZONE A: Corsair-owned (4 tables)          ZONE B: Drizzle-owned (7 tables)
│   ├── corsair_integrations                   ├── users
│   ├── corsair_accounts                       ├── github_connections
│   ├── corsair_entities  ← sync cache         ├── conversations
│   └── corsair_events    ← webhook log        ├── messages
│                                              ├── repository_summaries
│   Created by: `pnpm corsair setup`           ├── embeddings
│   Managed by: Corsair internally             └── activity_logs
│   Drizzle: MUST NEVER TOUCH
│                                              Created by: `drizzle-kit push`
│                                              Managed by: Drizzle schema
│                                              Corsair: ignores completely
```

Corsair and Drizzle share the same physical Postgres database — they just never
touch each other's tables.

### Fact 3 — Multi-tenancy is per-user isolation at the query level

With `multiTenancy: true`, every Corsair operation is namespaced by a
`tenant_id` string. The `corsair_accounts` table stores
`tenant_id TEXT NOT NULL`, and every query Corsair makes is
`WHERE tenant_id = $1`. This means:

- User A's GitHub token is never accessible from User B's tenant context
- `corsair.github` (top-level) **does not exist** with `multiTenancy: true`
- Every call goes through `corsair.withTenant(userId).*`

The `tenant_id` you pass to `withTenant()` is just a string you own — it should
be your `users.corsairTenantId` column. You control that mapping.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Next.js App (App Router)                             │
│                                                                             │
│  app/api/chat/route.ts          app/api/auth/callback/github/route.ts       │
│       │                                    │                                │
│       │ streamText()                       │ exchangeCodeForToken()          │
│       │                                    │ corsair.withTenant().github     │
│       ▼                                    │   .setupAccount()               │
│  AI SDK Tool Registry                      │                                │
│  ├── get-repositories.ts                   ▼                                │
│  ├── get-commits.ts              ┌──────────────────┐                       │
│  ├── get-issues.ts               │   users table    │                       │
│  ├── get-pull-requests.ts        │ corsairTenantId  │ ◄── bridge column     │
│  ├── get-file-content.ts         └────────┬─────────┘                       │
│  └── create-issue.ts                      │                                │
│       │                                   │                                │
└───────┼───────────────────────────────────┼────────────────────────────────┘
        │                                   │
        ▼                                   ▼
┌───────────────────┐            ┌──────────────────────┐
│  server/corsair.ts│            │   Corsair Client      │
│  createCorsair()  │────────────│  multiTenancy: true   │
│  pg.Pool          │            │  plugins: [github()]  │
│  CORSAIR_KEK      │            └──────────┬───────────┘
└───────────────────┘                       │
                                            │ .withTenant(userId)
                                            ▼
                                ┌──────────────────────────────┐
                                │    Tenant-scoped API          │
                                │                               │
                                │  .github.db.repositories      │ ◄── reads corsair_entities
                                │  .github.db.commits           │ ◄── reads corsair_entities
                                │  .github.db.issues            │ ◄── reads corsair_entities
                                │  .github.db.pull_requests     │ ◄── reads corsair_entities
                                │  .github.api.repositories.*   │ ◄── live GitHub REST API
                                │  .github.api.issues.*         │ ◄── live GitHub REST API
                                └──────────────────────────────┘
                                            │
                                            ▼
                                ┌──────────────────────────────┐
                                │      Neon Postgres            │
                                │  (DATABASE_URL_POOLED)        │
                                │                               │
                                │  corsair_integrations         │
                                │  corsair_accounts             │
                                │  corsair_entities  ← 60 rows  │
                                │  corsair_events               │
                                │  ──────────────────           │
                                │  users                        │
                                │  github_connections           │
                                │  conversations                │
                                │  messages                     │
                                │  repository_summaries         │
                                │  embeddings                   │
                                │  activity_logs                │
                                └──────────────────────────────┘
```

**Data flow for a chat query:**

1. User sends "show me my last 5 commits on `ApexZero`"
2. AI SDK calls `get-commits` tool with `{ repo: "ApexZero", limit: 5 }`
3. Tool calls
   `corsair.withTenant(user.corsairTenantId).github.db.commits.search({ filters: { repository: "ApexZero" } })`
4. Corsair queries
   `corsair_entities WHERE tenant_id = $1 AND entity_type = 'commits'`
5. Data returned instantly (no GitHub API call, no rate limits)
6. AI formats and streams response

---

## ⚠️ The Golden Rule — Two Systems, Two Namespaces

**Corsair and Drizzle are two completely separate schema management systems.
They NEVER own the same tables.**

| System      | Tables it owns                                                                                                    | How created                                 | What manages it                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------- |
| **Corsair** | `corsair_integrations`, `corsair_accounts`, `corsair_entities`, `corsair_events`                                  | `pnpm corsair setup --plugin=github` CLI    | Corsair internally — runs its own migrations |
| **Drizzle** | `users`, `github_connections`, `conversations`, `messages`, `repository_summaries`, `embeddings`, `activity_logs` | `pnpm drizzle-kit push` from `db/schema.ts` | Drizzle Kit — reads your TypeScript schema   |

### Rules that must never be broken

1. **Never write Drizzle TypeScript schema for Corsair's 4 tables.** The SQL in
   [Step 5](#️-step-5--migrate-the-database-corsairs-4-tables) is for reference
   only — never paste it into `db/schema.ts` as Drizzle definitions.

2. **Always have `tablesFilter: ["!corsair_*"]` in `drizzle.config.ts`.**
   Without it, the next `drizzle-kit push` will see Corsair's tables as "unknown
   tables" and offer to DROP them. If you ever see `corsair_*` listed as "about
   to be deleted", **abort immediately** and add the filter.

3. **Never pass Drizzle's `db` instance to `createCorsair()`.** The `database`
   field takes a raw `pg.Pool`. Passing the Drizzle wrapper will cause silent
   failures or runtime errors.

4. **Never use `multiTenancy: false` in production.** You cannot change it later
   without a data migration. Set it correctly on Day 1.

---

## 📦 Step 1 — Install Dependencies

```bash
# Production dependencies
pnpm add corsair @corsair-dev/github pg drizzle-orm dotenv

# Dev tools (CLI + type safety)
pnpm add -D @corsair-dev/cli drizzle-kit @types/pg
```

**What each package does:**

| Package               | Purpose                                                                               |
| --------------------- | ------------------------------------------------------------------------------------- |
| `corsair`             | Core library — `createCorsair()`, tenant management, encryption                       |
| `@corsair-dev/github` | GitHub plugin — adds `.github.db.*` and `.github.api.*`                               |
| `@corsair-dev/cli`    | Dev CLI — `pnpm corsair setup`, `pnpm corsair generate-kek`                           |
| `pg`                  | Raw Postgres driver — Corsair requires this directly                                  |
| `drizzle-orm`         | ORM for your 7 app tables                                                             |
| `drizzle-kit`         | Schema migration CLI — `drizzle-kit push`                                             |
| `dotenv`              | Load `.env` in scripts (not needed in Next.js app routes, only in standalone scripts) |
| `@types/pg`           | TypeScript types for `pg`                                                             |

**Verify installed versions (this project uses):**

```bash
pnpm list corsair @corsair-dev/github @corsair-dev/cli

# Expected:
# corsair                 0.1.76
# @corsair-dev/github     0.1.10
# @corsair-dev/cli        0.1.19
```

> If Corsair's CLI (`pnpm corsair`) doesn't resolve after install, add `.bin` to
> your path or prefix with `./node_modules/.bin/corsair`. The `pnpm corsair`
> shorthand works because `@corsair-dev/cli` registers a binary named `corsair`.

---

## 🔑 Step 2 — Generate Your KEK

The KEK (Key Encryption Key) is a 32-byte random secret that Corsair uses to
encrypt the per-account DEKs (Data Encryption Keys). The encryption chain is:

```
GitHub OAuth Token
    │
    ▼ encrypted with
Account DEK  (random, unique per account)
    │
    ▼ encrypted with
Master KEK   ← this is CORSAIR_KEK in your .env
    │
    ▼ stored in
corsair_accounts.dek column
```

**Why this matters:** If you lose `CORSAIR_KEK`, you lose the ability to decrypt
any DEK, which means you lose access to all stored GitHub tokens. The GitHub
data in `corsair_entities` is still readable (it's plaintext), but you can't
make any new API calls until users re-authenticate.

### Generate the KEK

**Option A — Corsair CLI (recommended):**

```bash
pnpm corsair generate-kek
# Output: CORSAIR_KEK=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Option B — openssl:**

```bash
# macOS / Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

**Option C — Node.js:**

```js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

All three produce a valid 256-bit key. Copy the output.

> ⚠️ **CRITICAL: Back this up before you do anything else.** Store it in Vercel
> Environment Variables, Doppler, 1Password, AWS Secrets Manager, or any secrets
> vault. Write it in a comment in your diary if you have to. This is the only
> key that can never be regenerated without user impact.

> ⚠️ **Never rotate the KEK casually.** Rotation requires decrypting every DEK
> with the old KEK, re-encrypting with the new KEK, and storing the result — in
> a transaction. There is no built-in rotation command. If you need to rotate,
> write a migration script first.

---

## 🔐 Step 3 — Environment Variables

Create/update your `.env` file:

```env
# ─── Database ──────────────────────────────────────────────────────────────────
# Neon provides two URLs per project:
#   DATABASE_URL        = direct connection (use for drizzle-kit in some setups)
#   DATABASE_URL_POOLED = PgBouncer pooled connection (use for app + Corsair)
#
# Corsair and your pg.Pool both use the POOLED url (handles connection limits).
# If you only have one URL, use it for both.
DATABASE_URL_POOLED=postgresql://user:password@host-pooler.neon.tech/dbname?sslmode=require

# ─── Corsair ───────────────────────────────────────────────────────────────────
# Generated once via `pnpm corsair generate-kek`. Never rotated without a migration.
CORSAIR_KEK=Jrs8clJsbRSVsSrj53Kq8MC7dkGNoZMGBT0icXWT6HU=

# ─── GitHub OAuth App (for production sign-in) ─────────────────────────────────
# Create at: https://github.com/settings/developers → OAuth Apps → New OAuth App
# Callback URL: http://localhost:3000/api/auth/callback/github (dev)
#               https://your-domain.com/api/auth/callback/github (prod)
GITHUB_CLIENT_ID=Ov23liXXXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── AI (for the chat feature, Day 11+) ────────────────────────────────────────
OPENAI_API_KEY=sk-proj-...

# ─── Inngest (for background jobs, Day 13+) ────────────────────────────────────
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### Why `DATABASE_URL_POOLED` and not `DATABASE_URL`?

Neon uses PgBouncer as a connection pooler. In serverless Next.js deployments,
each request can spawn a new process, and Postgres has a hard cap on
simultaneous connections (~100 on the free tier). Without pooling:

- 100 simultaneous Vercel function invocations = 100 Postgres connections =
  connection exhaustion
- With PgBouncer pooling: 100 functions share a small pool (5–10 actual
  connections)

Always use the `*-pooler.neon.tech` URL in your app. Reserve the direct URL for
`drizzle-kit` migrations if you need it.

---

## 📁 Step 4 — Create the File Structure

Create these files **in this exact order** before running any CLI commands. Each
file has dependencies on the previous ones.

---

### `lib/pool.ts`

The single shared `pg.Pool` instance. Both Corsair and Drizzle use this —
Corsair gets it directly, Drizzle wraps it.

```typescript
// lib/pool.ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POOLED,
  // Optional tuning for Neon's serverless environment:
  max: 10, // max connections in pool (stay well under Neon's limit)
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
```

> **Why a single shared `Pool`?** Creating a `new Pool()` per request in Next.js
> is a classic mistake that causes connection exhaustion. The `pool` singleton
> is created once at module load time and reused. Both `db/index.ts` and
> `server/corsair.ts` import from here.

---

### `server/corsair.ts`

The Corsair client. This is the entry point for all GitHub data access. Notice
it takes the raw `pool` — not the Drizzle `db`.

```typescript
// server/corsair.ts
import dotenv from "dotenv";
dotenv.config(); // Needed for standalone scripts (bun server/playground.ts).
// Next.js API routes load .env automatically — harmless to call here.

import { createCorsair } from "corsair";
import { github } from "@corsair-dev/github";
import { pool } from "@/lib/pool";

export const corsair = createCorsair({
  database: pool, // ← raw pg.Pool, NOT the Drizzle instance
  kek: process.env.CORSAIR_KEK!,
  plugins: [github()],
  multiTenancy: true, // ← ALWAYS true for real apps. Never change this later.
});
```

**Why `multiTenancy: true` is not optional:**

| Setting | Behavior                                     | Problem                                                                        |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `false` | One global GitHub account for the whole app  | All users share one token. Changing to `true` requires data migration          |
| `true`  | Each user gets completely isolated namespace | Correct. `corsair.github` doesn't exist at top level — must use `withTenant()` |

Set this correctly from Day 1. There is no safe upgrade path without a data
migration.

---

### `db/schema.ts`

Your 7 Drizzle-managed tables. These are the _only_ tables that should appear in
this file — never add Corsair's 4 tables here.

```typescript
// db/schema.ts
import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

// ─── users ────────────────────────────────────────────────────────────────────
// One row per authenticated user.
// corsairTenantId is the BRIDGE between this app and Corsair's tenant namespace.
// The value stored here is exactly what you pass to corsair.withTenant() and
// what you use with `pnpm corsair setup --tenant=<value>`.
// Best practice: use the GitHub numeric user ID (e.g. "12345678") — stable
// across username renames and guaranteed globally unique.
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  // Matches the --tenant value passed to `corsair setup --tenant=<id>`
  corsairTenantId: text("corsair_tenant_id").unique(),
});

// ─── github_connections ───────────────────────────────────────────────────────
// Records which GitHub identity belongs to each user after OAuth sign-in.
// githubUserId mirrors corsairTenantId — use the same value for both.
export const githubConnections = pgTable("github_connections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  githubLogin: text("github_login").notNull(), // e.g. "therajarshichakraborty"
  githubUserId: text("github_user_id").notNull(), // e.g. "12345678" — stable ID
  connectedAt: timestamp("connected_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── conversations ────────────────────────────────────────────────────────────
// Each chat session. Optionally scoped to a single repository.
export const conversations = pgTable("conversations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  repositoryOwner: text("repository_owner"),
  repositoryName: text("repository_name"),
});

// ─── messages ─────────────────────────────────────────────────────────────────
// Individual turns inside a conversation.
// toolCalls stores AI SDK CoreToolCall[] as JSONB so the UI can render
// tool call results inline in the chat history.
export const messages = pgTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant' | 'tool'
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"), // AI SDK CoreToolCall[] | null
});

// ─── repository_summaries ─────────────────────────────────────────────────────
// AI-generated summaries per repo.
// Written by the Inngest `generate-repo-summary` job on github.connected event.
// Powers the "what is this repo about?" context in the chat system prompt.
export const repositorySummaries = pgTable("repository_summaries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  repositoryOwner: text("repository_owner").notNull(),
  repositoryName: text("repository_name").notNull(),
  summary: text("summary").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── embeddings ───────────────────────────────────────────────────────────────
// Semantic embeddings over Corsair-synced content.
// sourceId = entity_id from corsair_entities — this is how we link back to
// the original synced entity for full content retrieval.
// embedding stored as JSONB (number[]) until pgvector is enabled on the Neon
// project. Swap to vector(1536) when ready:
//   import { vector } from "drizzle-orm/pg-core";
//   embedding: vector("embedding", { dimensions: 1536 })
export const embeddings = pgTable("embeddings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(), // 'repository' | 'commit' | 'issue' | 'pull_request'
  sourceId: text("source_id").notNull(), // entity_id from corsair_entities
  content: text("content").notNull(), // the text chunk that was embedded
  embedding: jsonb("embedding"), // number[] — swap to vector() later
  metadata: jsonb("metadata"),
});

// ─── activity_logs ────────────────────────────────────────────────────────────
// Recent developer activity per repo.
// Written by the Inngest `update-activity-log` function triggered on GitHub webhooks.
// Powers the "Continue Working" dashboard — shows what you were last doing.
export const activityLogs = pgTable("activity_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  repositoryOwner: text("repository_owner"),
  repositoryName: text("repository_name"),
  activityType: text("activity_type").notNull(), // 'commit' | 'pr' | 'issue' | 'review'
  activityId: text("activity_id"),
  title: text("title"),
  description: text("description"),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
});
```

---

### `db/index.ts`

The Drizzle instance. Pass `{ schema }` so that `db.query.tableName.findFirst()`
(relational queries) work — without it, you're limited to
`db.select().from(table)` style.

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "@/lib/pool";
import * as schema from "./schema";

// Pass schema so db.query.users.findFirst() etc. work (relational query builder)
export const db = drizzle(pool, { schema });
```

---

### `drizzle.config.ts`

```typescript
// drizzle.config.ts
import dotenv from "dotenv";
dotenv.config();
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./db/schema.ts"], // ← ONLY your schema file, not server/ or any Corsair schema
  out: "./drizzle", // migration files output directory
  // CRITICAL: Tells drizzle-kit to pretend corsair_* tables don't exist.
  // Without this, `drizzle-kit push` will see them as "unknown tables"
  // and offer to DROP them — which would destroy all synced GitHub data.
  tablesFilter: ["!corsair_*"],
  dbCredentials: {
    url: process.env.DATABASE_URL_POOLED!,
  },
});
```

---

## 🗃️ Step 5 — Migrate the Database (Corsair's 4 Tables)

Before anything else, Corsair's 4 tables must exist in Neon. There are two paths
— pick one.

### Path A — CLI (Simplest, Recommended)

This is what we use. It runs Corsair's internal migration AND registers the
GitHub plugin in one command:

```bash
pnpm corsair setup --plugin=github
```

**Expected output:**

```
[corsair:setup] Running migrations...
[corsair:setup] Created table: corsair_integrations ✓
[corsair:setup] Created table: corsair_accounts ✓
[corsair:setup] Created table: corsair_entities ✓
[corsair:setup] Created table: corsair_events ✓
[corsair:setup] 'github' (api_key) is configured ✓
```

> **The SSL warning** (`sslmode` notice from `pg`) is cosmetic — Neon uses SSL
> by default and `pg` acknowledges it. This is not an error. Nothing is broken.

> **If you see `command not found: corsair`:** Run
> `./node_modules/.bin/corsair setup --plugin=github` instead, or ensure
> `@corsair-dev/cli` is in `devDependencies` and run `pnpm install` again.

---

### Path B — Manual SQL (if you need to inspect or version-control it)

This is the **exact SQL** Corsair runs internally, extracted from
`corsair@0.1.76/dist/tests.js`. Run this in the Neon SQL editor if you prefer
full visibility:

```sql
-- Corsair migration SQL (PostgreSQL)
-- Source: corsair package internals — do NOT hand-write Drizzle schema for these

CREATE TABLE IF NOT EXISTS corsair_integrations (
    id          TEXT PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name        TEXT NOT NULL,
    config      JSONB NOT NULL DEFAULT '{}',
    dek         TEXT
);

CREATE TABLE IF NOT EXISTS corsair_accounts (
    id             TEXT PRIMARY KEY,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tenant_id      TEXT NOT NULL,
    integration_id TEXT NOT NULL REFERENCES corsair_integrations(id),
    config         JSONB NOT NULL DEFAULT '{}',
    dek            TEXT
);

CREATE TABLE IF NOT EXISTS corsair_entities (
    id          TEXT PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    account_id  TEXT NOT NULL REFERENCES corsair_accounts(id),
    entity_id   TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    version     TEXT NOT NULL,
    data        JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS corsair_events (
    id          TEXT PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    account_id  TEXT NOT NULL REFERENCES corsair_accounts(id),
    event_type  TEXT NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    status      TEXT
);
```

> ⚠️ **Do NOT copy this SQL into `db/schema.ts` as Drizzle TypeScript
> definitions.** This is reference-only. Corsair owns these tables; Drizzle must
> ignore them.

---

### Verify All 4 Tables Exist (Neon SQL Editor)

Run this after either path:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'corsair%'
ORDER BY table_name;
```

**Expected result:**

```
 table_name
───────────────────────
 corsair_accounts
 corsair_entities
 corsair_events
 corsair_integrations
(4 rows)
```

If fewer than 4 rows appear, the setup command failed silently. Re-run Path A.

---

## 🚀 Step 6 — Push Your App Schema

Now push your 7 Drizzle-managed tables. At this point, Corsair's 4 tables
already exist — `tablesFilter` ensures Drizzle ignores them completely.

```bash
pnpm drizzle-kit push
```

**Expected output (clean run, no prompts):**

```
[✓] Pulling schema from database...
[✓] Comparing schemas...
+ users table will be created
+ github_connections table will be created
+ conversations table will be created
+ messages table will be created
+ repository_summaries table will be created
+ embeddings table will be created
+ activity_logs table will be created
[✓] Changes applied
```

---

### ❌ Danger Signs During `drizzle-kit push`

#### Danger Sign 1 — Corsair tables listed as "about to be deleted"

```
~ corsair_accounts table is about to be deleted
~ corsair_entities table is about to be deleted
```

**Cause:** `tablesFilter: ["!corsair_*"]` is missing from `drizzle.config.ts`.

**Fix:**

1. **Choose "No, abort"** at the prompt — do not apply these changes
2. Add `tablesFilter: ["!corsair_*"]` to `drizzle.config.ts`
3. Re-run `pnpm drizzle-kit push`

#### Danger Sign 2 — "Is X table created or renamed from another table?"

```
? Is users table created or renamed from another table?
  ❯ + users (create table)
    ~ rename from old_users
```

**Always choose the `+` (create table) option.** Never choose a `~` rename
option unless you explicitly renamed a table and are handling a migration.

#### Danger Sign 3 — `drizzle-kit push` hangs at "Pulling schema"

**Cause:** Usually a bad `DATABASE_URL_POOLED` — wrong host, wrong password, SSL
config issue.

**Fix:** Test the connection:

```bash
node -e "require('dotenv').config(); const { Pool } = require('pg'); new Pool({ connectionString: process.env.DATABASE_URL_POOLED }).query('SELECT 1').then(r => console.log('OK:', r.rows)).catch(e => console.error('FAIL:', e.message))"
```

---

## 🧪 Step 7 — Provision a Tenant & Smoke Test

Corsair needs to know about each user (tenant) before you can query their data.
In production this happens via the OAuth callback (Day 5). For development and
smoke testing, provision manually.

### Get a GitHub Personal Access Token

1. Go to **GitHub → Settings → Developer settings → Personal access tokens →
   Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy the token — it starts with `ghp_`

> **Why classic tokens and not fine-grained?** Fine-grained tokens (starting
> with `github_pat_`) work but require you to explicitly select repositories.
> Classic tokens with `repo` scope work across all your repos. For a dev smoke
> test, classic is simpler.

---

### Run Setup + Backfill

**macOS / Linux:**

```bash
export GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE

# Single-tenant (no per-user isolation, dev only):
pnpm corsair setup --plugin=github api_key=$GITHUB_TOKEN --backfill

# Multi-tenant (always use this form in your project):
pnpm corsair setup --tenant=test_user --plugin=github api_key=$GITHUB_TOKEN --backfill
```

**Windows PowerShell:**

```powershell
$env:GITHUB_TOKEN = "ghp_YOUR_TOKEN_HERE"

# Multi-tenant:
pnpm corsair setup --tenant=test_user --plugin=github api_key=$env:GITHUB_TOKEN --backfill
```

> **Note on command format:** The official docs show `api_key=` as a positional
> argument, not `--api-key`. Both `--github api_key=` and `api_key=` inline work
> — the inline form is shorter.

---

### Expected Output (Full Success)

```
[corsair:setup] Created account: github
[corsair:setup] Issued account DEK: github
[corsair:setup] Set github account.api_key (tenant=test_user)
[corsair:setup] 'github' (api_key) is configured ✓
[corsair:setup] Starting backfill...
[corsair:setup] Backfilling github › repositories.list...
[corsair:setup] Backfilling github › issues.list...
[corsair:setup] Backfilling github › pull_requests.list...
[corsair:setup] Backfilling github › commits.list...
[corsair:setup] Backfill complete.
```

---

### Verify Backfill in Neon SQL Editor

```sql
-- Check entity counts by type
SELECT entity_type, count(*) as count
FROM corsair_entities
GROUP BY entity_type
ORDER BY count DESC;

-- Expected (numbers vary by your account):
-- entity_type   | count
-- ──────────────┼───────
-- repositories  |    60
-- issues        |    14
-- pull_requests |     8
-- commits       |   240

-- Confirm the tenant_id is set correctly
SELECT DISTINCT
    ca.tenant_id,
    ci.name as integration_name,
    count(ce.id) as entity_count
FROM corsair_accounts ca
JOIN corsair_integrations ci ON ci.id = ca.integration_id
LEFT JOIN corsair_entities ce ON ce.account_id = ca.id
GROUP BY ca.tenant_id, ci.name;

-- Expected:
-- tenant_id  | integration_name | entity_count
-- ───────────┼──────────────────┼──────────────
-- test_user  | github           |          322
```

**You must see `repositories` with `count > 0` before proceeding.** If
`corsair_entities` is empty, the backfill failed — re-run the setup command with
the `--backfill` flag and check that the GitHub token has `repo` scope.

---

## 🔗 Step 8 — End-to-End Wiring Test

This script tests that the two systems (Drizzle + Corsair) cooperate correctly
via the `corsairTenantId` bridge column. Run it with `bun server/playground.ts`
or `npx ts-node server/playground.ts`.

```typescript
// server/playground.ts
import { corsair } from "./corsair";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

console.log("🔌 Running end-to-end wiring test...\n");

// ── Step 1: Insert a user linked to the test_user Corsair tenant ────────────
const [inserted] = await db
  .insert(users)
  .values({
    email: "smoke-test@example.com",
    name: "Smoke Test User",
    corsairTenantId: "test_user", // must match --tenant value from setup
  })
  .onConflictDoUpdate({
    target: users.email,
    set: { corsairTenantId: "test_user" },
  })
  .returning();

console.log("✓ Step 1 — Drizzle insert succeeded, user ID:", inserted.id);

// ── Step 2: Read the user back via Drizzle relational query ────────────────
const found = await db.query.users.findFirst({
  where: eq(users.email, "smoke-test@example.com"),
});

if (!found) throw new Error("User not found — db.query is broken");
console.log(
  "✓ Step 2 — Drizzle read succeeded, corsairTenantId:",
  found.corsairTenantId,
);

// ── Step 3: Query Corsair using the tenant key from our users table ─────────
// This proves the bridge works: Drizzle row → corsairTenantId → Corsair query
const repos = await (corsair as any)
  .withTenant(found.corsairTenantId)
  .github.db.repositories.search({});

console.log(
  `✓ Step 3 — Corsair returned ${repos.length} repositories from corsair_entities`,
);

if (repos.length === 0) {
  console.error(
    "❌ No repositories found. Did you run --backfill? Is GITHUB_TOKEN correct?",
  );
  process.exit(1);
}

console.log(`\n🎉 Foundation is solid! All 3 steps passed.`);
console.log(`   Drizzle ↔ Corsair handshake works correctly.\n`);

// Clean up test user (optional — leave it for Day 5 tenant provisioning tests)
// await db.delete(users).where(eq(users.email, "smoke-test@example.com"));
```

**All 3 steps must print `✓` before moving on.** If Step 3 fails with
"corsair.github is undefined", your `corsair.ts` has `multiTenancy: false` or
you're calling `corsair.github.*` without `withTenant()`.

---

## 🧠 The API Pattern — Always Use `withTenant()`

With `multiTenancy: true`, `corsair.github` does not exist at the top level.
Every call must be scoped:

```typescript
// ❌ WRONG — TypeError: Cannot read properties of undefined (reading 'db')
corsair.github.db.repositories.search({});
corsair.github.api.repositories.listCommits({ owner, repo });

// ✅ CORRECT — always scope to a tenant first
const tenant = corsair.withTenant(userId); // userId = users.corsairTenantId value
```

---

### Corsair `.github.db.*` — Fast local reads (use for AI tools)

These read from `corsair_entities` directly. No API call to GitHub, no rate
limits, ~1ms latency.

```typescript
const tenant = corsair.withTenant(user.corsairTenantId);

// List all repositories (from local sync cache)
const repos = await tenant.github.db.repositories.search({});

// Search commits in a specific repo
const commits = await tenant.github.db.commits.search({
  filters: { repository: "ApexZero" },
});

// Search all open PRs
const prs = await tenant.github.db.pull_requests.search({
  filters: { state: "open" },
});

// Search issues
const issues = await tenant.github.db.issues.search({
  filters: { state: "open", repository: "my-repo" },
});

// Branches
const branches = await tenant.github.db.branches.search({});
```

---

### Corsair `.github.api.*` — Live GitHub API calls (use sparingly)

These call the GitHub REST API in real-time, injecting the stored token
automatically. Use for write operations and for data not in the sync cache (file
contents, raw diffs, etc.).

```typescript
// List commits (live, not cached — use .db.commits for chat tools)
await tenant.github.api.repositories.listCommits({
  owner: "me",
  repo: "my-repo",
});

// Get a specific file's content (not in sync cache — must use live API)
await tenant.github.api.repos.getContent({
  owner: "me",
  repo: "my-repo",
  path: "README.md",
});

// Create an issue (write operation)
await tenant.github.api.issues.create({
  owner: "me",
  repo: "my-repo",
  title: "New issue from AI",
  body: "This was created via the chat interface.",
});

// List issues for a repo (live)
await tenant.github.api.issues.listForRepo({ owner: "me", repo: "my-repo" });
```

---

### Getting `userId` in API Routes

In production, always derive the tenant ID from your auth session — never
hardcode it:

```typescript
// In a Next.js App Router API route:
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { corsair } from "@/server/corsair";

export async function POST(req: Request) {
  // 1. Verify the session
  const session = await auth.getSession(req);
  if (!session) return new Response("Unauthorized", { status: 401 });

  // 2. Load the user row (which has corsairTenantId)
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  if (!user?.corsairTenantId) {
    return new Response("GitHub not connected", { status: 403 });
  }

  // 3. Scope Corsair to this user's tenant
  const tenant = (corsair as any).withTenant(user.corsairTenantId);

  // 4. Query
  const repos = await tenant.github.db.repositories.search({});
  return Response.json({ repos });
}
```

---

## 🔄 Production Tenant Provisioning (OAuth Callback)

When a user connects their GitHub account via OAuth, two things must happen in
sequence:

1. Upsert the `users` row with the GitHub user's numeric ID as `corsairTenantId`
2. Call `corsair.withTenant().github.setupAccount({ api_key: access_token })` to
   store the OAuth token in Corsair's encrypted vault

```typescript
// app/api/auth/callback/github/route.ts
import { corsair } from "@/server/corsair";
import { db } from "@/db";
import { users, githubConnections } from "@/db/schema";
import { inngest } from "@/lib/inngest"; // add on Day 13

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  // 1. Exchange code for token + user info (BetterAuth handles this, or do it manually)
  const { access_token, github_user } = await exchangeCodeForToken(code);
  //   github_user.id is a number — e.g. 12345678
  //   github_user.login is a string — e.g. "therajarshichakraborty"

  // 2. Upsert users row
  //    Use github_user.id.toString() as corsairTenantId — stable across renames
  const [user] = await db
    .insert(users)
    .values({
      email: github_user.email,
      name: github_user.name,
      avatarUrl: github_user.avatar_url,
      corsairTenantId: github_user.id.toString(), // e.g. "12345678"
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: github_user.name,
        avatarUrl: github_user.avatar_url,
        corsairTenantId: github_user.id.toString(),
      },
    })
    .returning();

  // 3. Record the connection
  await db
    .insert(githubConnections)
    .values({
      userId: user.id,
      githubLogin: github_user.login,
      githubUserId: github_user.id.toString(),
    })
    .onConflictDoNothing();

  // 4. Provision Corsair tenant with the OAuth token
  await (corsair as any)
    .withTenant(user.corsairTenantId)
    .github.setupAccount({ api_key: access_token });

  // 5. Trigger async backfill via Inngest (Day 13+)
  // await inngest.send({
  //     name: "github/connected",
  //     data: { userId: user.id, corsairTenantId: user.corsairTenantId },
  // });

  // 6. Redirect to dashboard
  return Response.redirect(new URL("/dashboard", req.url));
}
```

> **Why the GitHub numeric ID and not the login string?** GitHub users can
> rename their account (`login` changes). The numeric `id` is immutable — it
> persists even if they rename. Using the login string as a tenant key would
> silently break all Corsair queries after a rename.

---

## 🔔 Webhook Handling

For real-time sync (new commits, PRs, etc.), set up a webhook endpoint:

```typescript
// app/api/webhooks/github/route.ts
import { corsair } from "@/server/corsair";

export async function POST(req: Request) {
  const payload = await req.json();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  // Corsair's processWebhook handles signature verification,
  // entity updates in corsair_entities, and event logging in corsair_events
  await (corsair as any).processWebhook({
    payload,
    signature,
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  });

  return new Response("OK", { status: 200 });
}
```

**Configure the webhook in GitHub:**

1. Repo → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-domain.com/api/webhooks/github`
3. Content type: `application/json`
4. Secret: same value as `GITHUB_WEBHOOK_SECRET` in your `.env`
5. Events: Push, Pull requests, Issues (at minimum)

---

## 🚨 Common Errors & Fixes

### Error: `corsair.github is undefined` or `Cannot read properties of undefined`

**Cause:** You're calling `corsair.github.*` without `withTenant()`, while
`multiTenancy: true`.

**Fix:**

```typescript
// ❌ broken
corsair.github.db.repositories
  .search({})
  (
    // ✅ fixed
    corsair as any,
  )
  .withTenant(userId)
  .github.db.repositories.search({});
```

---

### Error: `drizzle-kit push` shows Corsair tables as "about to be deleted"

**Cause:** Missing `tablesFilter` in `drizzle.config.ts`.

**Fix:** Add to `drizzle.config.ts`:

```typescript
tablesFilter: ["!corsair_*"],
```

Then **abort the current prompt** and re-run `drizzle-kit push`.

---

### Error: `Invalid KEK format` or `Cannot decrypt DEK`

**Cause A:** `CORSAIR_KEK` is missing from `.env` or not loaded.  
**Cause B:** The KEK in `.env` doesn't match the one used when accounts were
provisioned (was rotated without a migration).

**Fix A:** Ensure `.env` exists, has `CORSAIR_KEK=...`, and that
`dotenv.config()` is called before `createCorsair()`.  
**Fix B:** Restore the original KEK from your secrets vault. If lost, users must
re-authenticate via OAuth.

---

### Error: `pnpm corsair setup` hangs or times out

**Cause:** `DATABASE_URL_POOLED` is wrong — connection cannot be established.

**Fix:** Test your connection string:

```bash
# PowerShell
node -e "require('dotenv').config(); const { Pool } = require('pg'); new Pool({ connectionString: process.env.DATABASE_URL_POOLED }).query('SELECT NOW()').then(r => { console.log('Connected:', r.rows[0]); process.exit(0); }).catch(e => { console.error('Failed:', e.message); process.exit(1); })"
```

---

### Error: `tenant.github.db.repositories.search({})` returns empty array

**Cause A:** Backfill wasn't run (`--backfill` flag missing from setup).  
**Cause B:** The `--tenant` value doesn't match what's in
`corsair_accounts.tenant_id`.

**Fix A:** Re-run setup with `--backfill`.  
**Fix B:** Check:

```sql
SELECT tenant_id FROM corsair_accounts;
-- Compare with what you're passing to withTenant()
```

---

### Error: SSL/TLS warning in logs

```
Warning: There is already a client in the pool that has the same connectionString
```

or

```
notice: there is no parameter $1
```

These are cosmetic warnings from `pg` interacting with Neon's SSL. They do not
indicate failures. Your queries are working correctly.

---

### Error: `drizzle-kit push` asks about renaming tables

```
? Is users table created or renamed from another table?
```

**Always choose `+ users (create table)`.** Never choose a rename option unless
you explicitly renamed a table and are intentionally migrating data.

---

### Error: `TypeError: drizzle is not a function` or import issues

**Cause:** Using wrong Drizzle import for your driver.

**Fix:** For `pg` (node-postgres), always use:

```typescript
import { drizzle } from "drizzle-orm/node-postgres"; // ← correct
// NOT: import { drizzle } from "drizzle-orm/pg";      ← wrong for node-postgres
```

---

## 🔒 Security & Ops Runbook

### Secrets Checklist

| Secret                  | Where to store                             | Rotation policy                           |
| ----------------------- | ------------------------------------------ | ----------------------------------------- |
| `CORSAIR_KEK`           | Vercel Env Vars + 1Password/Doppler backup | Never rotate without a migration script   |
| `DATABASE_URL_POOLED`   | Vercel Env Vars                            | Rotate if DB credentials are compromised  |
| `GITHUB_CLIENT_SECRET`  | Vercel Env Vars                            | Rotate via GitHub → OAuth Apps            |
| `GITHUB_WEBHOOK_SECRET` | Vercel Env Vars                            | Rotate in GitHub Settings + .env together |
| `OPENAI_API_KEY`        | Vercel Env Vars                            | Rotate via OpenAI dashboard               |

### What happens if the KEK is lost?

1. `corsair_accounts.dek` can no longer be decrypted
2. Corsair cannot retrieve any stored OAuth tokens
3. All `.github.db.*` queries still work (data is plaintext in
   `corsair_entities`)
4. All `.github.api.*` calls fail (no token available)
5. Recovery: All users must re-sign-in via GitHub OAuth to re-provision their
   tenant

### What data is encrypted at rest?

| Column                        | Encrypted? | With what?                                    |
| ----------------------------- | ---------- | --------------------------------------------- |
| `corsair_accounts.dek`        | ✅ Yes     | Master KEK (AES-256-GCM)                      |
| `corsair_integrations.config` | Partially  | Sensitive fields only                         |
| `corsair_entities.data`       | ❌ No      | Plaintext JSON — this is sync cache           |
| All your Drizzle tables       | ❌ No      | Neon encrypts disk, but columns are plaintext |

### Multi-Tenant Isolation Audit

Before deploying, verify no cross-tenant data leakage:

```sql
-- Every corsair_entities row must be tied to an account with a specific tenant_id
-- This should return zero rows if isolation is correct:
SELECT e.id, e.entity_type, a.tenant_id
FROM corsair_entities e
JOIN corsair_accounts a ON a.id = e.account_id
WHERE a.tenant_id IS NULL;

-- Verify each tenant can only see their own repos:
SELECT a.tenant_id, count(e.id) as entity_count
FROM corsair_accounts a
LEFT JOIN corsair_entities e ON e.account_id = a.id
GROUP BY a.tenant_id
ORDER BY a.tenant_id;
```

---

## 📋 Final Checklist

Use this before moving from Day 3 to Day 4.

### Foundation

- [ ] `CORSAIR_KEK` generated once and backed up in a secrets manager
- [ ] `.env` has `DATABASE_URL_POOLED` and `CORSAIR_KEK` set
- [ ] `lib/pool.ts` creates a single `pg.Pool` shared by both Corsair and
      Drizzle

### Corsair Setup

- [ ] `server/corsair.ts` uses raw `pg.Pool` (not Drizzle), `multiTenancy: true`
- [ ] `pnpm corsair setup --plugin=github` ran successfully
- [ ] All 4 Corsair tables exist in Neon: `corsair_integrations`,
      `corsair_accounts`, `corsair_entities`, `corsair_events`

### Drizzle Setup

- [ ] `drizzle.config.ts` has `tablesFilter: ["!corsair_*"]`
- [ ] `db/schema.ts` has **zero references** to `corsair_*` tables
- [ ] `pnpm drizzle-kit push` ran cleanly with no rename prompts and no Corsair
      table warnings
- [ ] All 7 app tables exist in Neon: `users`, `github_connections`,
      `conversations`, `messages`, `repository_summaries`, `embeddings`,
      `activity_logs`

### Verification

- [ ] Tenant backfill ran (`--backfill` flag used), `corsair_entities` has rows
- [ ] `corsair_entities` has `repositories` with `count > 0`
- [ ] End-to-end smoke test passed — all 3 steps in `server/playground.ts`
      printed `✓`
- [ ] 11 total tables in Neon (4 Corsair + 7 Drizzle)

### Patterns

- [ ] All Corsair API calls use `corsair.withTenant(userId).*` — never
      `corsair.github.*` directly
- [ ] `corsairTenantId` on the `users` table is populated for every connected
      user
- [ ] GitHub numeric user ID is used as the `corsairTenantId` (not the login
      string)

---

## 🗂️ What Lives Where (Final State)

### Database (Neon — 11 tables total)

```
Neon Database
│
├── ── CORSAIR-OWNED (4) — created by `pnpm corsair setup`, managed by Corsair ──
│   ├── corsair_integrations   plugin registry (github entry)
│   ├── corsair_accounts       per-tenant account records, encrypted DEKs
│   ├── corsair_entities       sync cache: repos, commits, PRs, issues, branches
│   └── corsair_events         webhook event log (raw payloads + status)
│
└── ── DRIZZLE-OWNED (7) — created by `drizzle-kit push`, managed by schema.ts ──
    ├── users                  your app users, has corsairTenantId bridge column
    ├── github_connections     GitHub OAuth identity per user
    ├── conversations          AI chat sessions
    ├── messages               individual chat turns + AI tool call results
    ├── repository_summaries   AI-generated repo summaries (Inngest job)
    ├── embeddings             semantic embeddings for RAG search
    └── activity_logs          recent dev activity for "Continue Working" feature
```

### Project Files

```
takl-to-your-github/
│
├── lib/
│   └── pool.ts                 pg.Pool singleton — shared by Corsair + Drizzle
│
├── server/
│   ├── corsair.ts              Corsair client — createCorsair(), multiTenancy: true
│   └── playground.ts           End-to-end wiring test (3-step smoke test)
│
├── db/
│   ├── schema.ts               7 Drizzle tables (ONLY app tables — never Corsair)
│   └── index.ts                drizzle(pool, { schema }) — enables db.query.*
│
├── drizzle.config.ts           tablesFilter: ["!corsair_*"] — CRITICAL
│
├── app/
│   ├── api/
│   │   ├── chat/route.ts       AI SDK streamText() endpoint (Day 11)
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── github/route.ts   OAuth callback + Corsair tenant provisioning
│   │   └── webhooks/
│   │       └── github/route.ts       Corsair processWebhook() (Day 6)
│   └── ...
│
├── .env                        DATABASE_URL_POOLED, CORSAIR_KEK, GITHUB_*
├── .gitignore                  .env must be in here
└── corsair-setup.md            ← this file
```

---

## ⚡ Quick Reference — Command Cheat Sheet

```bash
# ── Install ─────────────────────────────────────────────────────────────────
pnpm add corsair @corsair-dev/github pg drizzle-orm dotenv
pnpm add -D @corsair-dev/cli drizzle-kit @types/pg

# ── KEK Generation ──────────────────────────────────────────────────────────
pnpm corsair generate-kek

# ── Corsair Setup (creates its 4 tables + registers GitHub plugin) ───────────
pnpm corsair setup --plugin=github

# ── Drizzle Push (creates your 7 tables) ─────────────────────────────────────
pnpm drizzle-kit push

# ── Provision a test tenant + backfill ────────────────────────────────────────
# macOS/Linux:
pnpm corsair setup --tenant=test_user --plugin=github api_key=$GITHUB_TOKEN --backfill
# Windows PowerShell:
pnpm corsair setup --tenant=test_user --plugin=github api_key=$env:GITHUB_TOKEN --backfill

# ── Smoke test (run after provisioning) ─────────────────────────────────────
bun server/playground.ts

# ── Verify Corsair tables in Neon ────────────────────────────────────────────
# (run in Neon SQL editor)
SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'corsair%' ORDER BY table_name;

# ── Verify entity counts ──────────────────────────────────────────────────────
SELECT entity_type, count(*) FROM corsair_entities GROUP BY entity_type;

# ── Check which tenant_ids are provisioned ────────────────────────────────────
SELECT tenant_id, count(*) as accounts FROM corsair_accounts GROUP BY tenant_id;
```

---

_Last updated: Day 3 complete — foundation verified, ready for Day 4 (Auth
scaffolding)._
