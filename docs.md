# 📚 Project Documentation: Talk to Your GitHub

Welcome to the **Talk to Your GitHub** documentation. This guide breaks down everything built so far, organized day by day with explicit file locations in clear and beginner friendly language.

---

## 🎯 Project Overview

This application lets users log in with GitHub and chat with an AI assistant about their GitHub code repositories, commits, branches, pull requests, and issues. 

It uses two database layers working together in PostgreSQL:
1. **Application Tables**: Managed by Drizzle ORM to store users, chats, messages, and settings.
2. **Sync Engine Tables**: Managed by Corsair to download and store GitHub repositories and events for each user in isolated tenant namespaces.

---

## 📅 Day 1: Project Setup and Foundation

### What was done
1. **Next.js and UI Framework**: Initialized a new Next.js 16 project using React 19, TypeScript, Tailwind CSS, and shadcn/ui components.
2. **Database Connection**: Set up PostgreSQL connection pooling using the `pg` package and configured Drizzle ORM.
3. **Corsair Client Configuration**: Initialized the Corsair sync engine with multi-tenancy enabled so each user receives an isolated data workspace.

### Files Added / Modified
- `lib/pool.ts` (PostgreSQL connection pool using `pg` Pool)
- `db/index.ts` (Drizzle ORM database client initialization)
- `drizzle.config.ts` (Drizzle configuration specifying schema path and database URL)
- `server/corsair.ts` (Corsair sync engine configured with multiTenancy and GitHub plugin)
- `.env` (Environment variables for database URL and Corsair encryption key)
- `components/ui/` (shadcn/ui component library setup)

### Beginner Explanation
Think of Day 1 as building the foundation of a house. Next.js serves as the web frame, Tailwind and shadcn/ui provide the wall paint and buttons, Neon PostgreSQL acts as the storage basement, and Corsair is installed as a specialized librarian responsible for reading GitHub data.

---

## 📅 Day 2: Corsair Setup and GitHub Data Syncing

### What was done
1. **Sync Engine Database Tables**: Ran the Corsair setup command to create 4 internal tables inside PostgreSQL.
2. **Initial Repository Backfill**: Imported initial repository metadata into the `corsair_entities` table to verify data syncing.
3. **API Playground Test**: Created a playground script to test fetching commit histories from GitHub live.

### Files Added / Modified
- `server/playground.ts` (Playground script to execute and verify Corsair API calls and backfill operations)
- PostgreSQL Database Tables Created: `corsair_integrations`, `corsair_accounts`, `corsair_entities`, `corsair_events`

### Beginner Explanation
Day 2 gives the librarian (Corsair) a set of filing cabinets in the database. The initial backfill fills those cabinets with basic repository information so the application has data to read.

---

## 📅 Day 3: Application Database Schema and Table Isolation

### What was done
1. **App Database Tables**: Defined 7 custom application tables in Drizzle schema.
2. **Table Separation Rule**: Added a filter to `drizzle.config.ts` so Drizzle ORM leaves Corsair's tables completely untouched.
3. **Database Migration and Testing**: Pushed the 7 tables to PostgreSQL using `drizzle-kit push` and confirmed both table systems operate cleanly side by side.

### Files Added / Modified
- `db/schema.ts` (Defined 7 Drizzle tables: `users`, `github_connections`, `conversations`, `messages`, `repository_summaries`, `embeddings`, `activity_logs`)
- `drizzle.config.ts` (Updated with `tablesFilter: ["!corsair_*"]` to isolate application tables from Corsair tables)

### Beginner Explanation
The database now contains two distinct sections: one section for storing app data like chat histories and user accounts (managed by Drizzle), and another section for raw GitHub data (managed by Corsair). They live in the same database without interfering with each other.

---

## 📅 Day 4: User Authentication Scaffolding

### What was done
1. **BetterAuth Integration**: Installed and configured `BetterAuth` using the Drizzle ORM database adapter.
2. **GitHub OAuth Login**: Configured GitHub OAuth credentials so users can click "Sign in with GitHub" to log into the application safely.
3. **Auth API Routes**: Created the authentication API handler to manage user sessions and cookies.

### Files Added / Modified
- `lib/auth.ts` (BetterAuth configuration with Drizzle adapter and GitHub OAuth provider)
- `app/api/auth/[...all]/route.ts` (Next.js App Router route handling all authentication requests and callbacks)

### Beginner Explanation
Day 4 adds the front door lock to our application. Users can log in securely using their existing GitHub account without creating a new password.

---

## 📅 Day 5: Multi-Tenant Provisioning

### What was done
1. **Automatic Tenant Creation**: Updated authentication logic so that when a user logs in for the first time, a unique `corsairTenantId` is assigned to their user row.
2. **Automatic Data Syncing**: Wired the authentication callback to automatically connect the user's GitHub access token to Corsair and trigger a data backfill.
3. **Tenant Status API Route**: Built an endpoint allowing the frontend to check if a user's GitHub sync engine is ready.

### Files Added / Modified
- `lib/auth.ts` (Added `provisionCorsairTenant` function hooked into `databaseHooks.account` to provision Corsair credentials upon sign-in)
- `app/api/user/tenant-status/route.ts` (API route checking session status, user database record, and verifying Corsair tenant initialization)

### Beginner Explanation
Multi-tenancy means keeping each user's data completely separate and private. When User A logs in, Corsair creates an isolated space for User A. When User B logs in, User B gets their own space, ensuring User A can never see User B's private repositories.

---

## 📅 Day 6: Backfill Trigger and Webhooks Receiver

### What was done
1. **Backfill API Endpoint**: Created an API endpoint allowing users to manually trigger data synchronization and inspect how many items were saved in the database.
2. **Live Webhook Endpoint**: Built a webhook route using Corsair's `processWebhook` function to receive real-time notifications from GitHub whenever code is pushed or an issue is created.

### Files Added / Modified
- `app/api/user/backfill/route.ts` (API endpoint supporting GET to check synced entity counts and POST to manually trigger tenant backfill)
- `app/api/webhooks/route.ts` (API endpoint receiving external GitHub webhook events and processing them through Corsair)

### Beginner Explanation
Initial backfill downloads old data, while webhooks listen for new live changes. If a user pushes a new commit to GitHub, GitHub sends an instant message to our webhook endpoint so our database stays updated automatically.

---

## 📅 Day 7: Data Sync Layer Verification

### What was done
1. **Sync Test API Route**: Created an API endpoint to test querying live GitHub data (branches, commits, pull requests, issues) and count database rows.
2. **Command Line Testing Tool**: Built a standalone terminal script to run sync checks directly for any tenant ID.
3. **TypeScript Type Fixes**: Resolved type strictness issues across API routes and test scripts to guarantee full code safety.

### Files Added / Modified
- `app/api/user/test-sync/route.ts` (API route testing live Corsair GitHub queries for branches, commits, PRs, issues, and database counts)
- `scripts/test-sync.ts` (Command line testing script to verify end-to-end sync capabilities for a given tenant ID)

### Beginner Explanation
Day 7 focused on verification and quality testing. We created test endpoints and command line tools to verify that repository data, branches, commits, pull requests, and issues are all accessible without bugs.

---

## 📊 Summary of Completed Milestones & Files

| Day | Feature Summary | Added / Modified Files | Status |
| :--- | :--- | :--- | :--- |
| **Day 1** | Next.js, Postgres Pool, Corsair Client | `lib/pool.ts`, `db/index.ts`, `drizzle.config.ts`, `server/corsair.ts` | Completed |
| **Day 2** | Corsair Table Setup & Backfill | `server/playground.ts` | Completed |
| **Day 3** | App Schema & Table Isolation | `db/schema.ts`, `drizzle.config.ts` | Completed |
| **Day 4** | BetterAuth & GitHub OAuth | `lib/auth.ts`, `app/api/auth/[...all]/route.ts` | Completed |
| **Day 5** | Multi-Tenant Provisioning | `lib/auth.ts`, `app/api/user/tenant-status/route.ts` | Completed |
| **Day 6** | Backfill API & GitHub Webhooks | `app/api/user/backfill/route.ts`, `app/api/webhooks/route.ts` | Completed |
| **Day 7** | Sync Layer Testing & Verification | `app/api/user/test-sync/route.ts`, `scripts/test-sync.ts` | Completed |
