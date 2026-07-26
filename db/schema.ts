import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

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