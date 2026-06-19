import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

// ─── users ────────────────────────────────────────────────────────────────────
// One row per authenticated user. corsairTenantId links to Corsair's tenant
// namespace — never store Corsair's internal table IDs here.
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
// Records which GitHub identity belongs to each user after OAuth.
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
    githubLogin: text("github_login").notNull(),
    githubUserId: text("github_user_id").notNull(),
    connectedAt: timestamp("connected_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

// ─── conversations ────────────────────────────────────────────────────────────
// Each chat session. Optionally scoped to a single repo.
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
// Individual turns inside a conversation. toolCalls stores AI SDK tool call
// results as JSONB so the UI can render them inline.
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
// AI-generated summaries per repo, written by the Inngest job on github.connected.
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
// Semantic embeddings over Corsair-synced content (repos, commits, PRs, issues).
// `embedding` is stored as JSONB (number[]) until pgvector is confirmed enabled
// on the Neon project; swap to vector(1536) when ready.
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
    sourceId: text("source_id").notNull(),     // entity_id from corsair_entities
    content: text("content").notNull(),        // the text that was embedded
    embedding: jsonb("embedding"),             // number[] — swap to vector() later
    metadata: jsonb("metadata"),
});

// ─── activity_logs ────────────────────────────────────────────────────────────
// Recent developer activity per repo, written by the Inngest webhook handler.
// Powers the "Continue Working" dashboard feature.
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