import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { setupCorsair } from "corsair";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { inngest } from "@/inngest";
import { corsair, corsairTenant } from "@/server/corsair";

interface GithubAccount {
  userId: string;
  githubUserId: string;
  accessToken: string;
}

async function fetchGithubLogin(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "talk-to-your-github",
      },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { login?: string };
    return user.login ?? null;
  } catch {
    return null;
  }
}

async function upsertConnection({ userId, githubUserId, accessToken }: GithubAccount) {
  const githubLogin = (await fetchGithubLogin(accessToken)) ?? githubUserId;
  const [existing] = await db
    .select({ id: schema.githubConnections.id })
    .from(schema.githubConnections)
    .where(eq(schema.githubConnections.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(schema.githubConnections)
      .set({ githubLogin, githubUserId })
      .where(eq(schema.githubConnections.id, existing.id));
  } else {
    await db
      .insert(schema.githubConnections)
      .values({ userId, githubUserId, githubLogin });
  }
}

async function onFirstConnect(account: GithubAccount) {
  const tenantId = account.githubUserId;

  await db
    .update(schema.user)
    .set({ corsairTenantId: tenantId })
    .where(eq(schema.user.id, account.userId));

  try {
    await setupCorsair(corsair, {
      tenantId,
      credentials: { github: { api_key: account.accessToken } },
      backfill: false,
    });
  } catch (error) {
    console.error(`[auth] Corsair setup failed for tenant ${tenantId}`, error);
  }

  await upsertConnection(account);

  await inngest
    .send({
      name: "github.connected",
      data: {
        userId: account.userId,
        corsairTenantId: tenantId,
        repositoryOwner: "",
        repositoryName: "",
      },
    })
    .catch((error) => console.error("[auth] initial sync not queued", error));
}

async function onReconnect(account: GithubAccount) {
  await corsairTenant(account.githubUserId)
    .github?.keys?.set_api_key(account.accessToken)
    .catch((error) => console.error("[auth] credential refresh failed", error));
  await upsertConnection(account);
}

function toGithubAccount(account: {
  providerId: string;
  userId: string;
  accountId: string;
  accessToken?: string | null;
}): GithubAccount | null {
  return account.providerId === "github" && account.accessToken
    ? {
        userId: account.userId,
        githubUserId: account.accountId,
        accessToken: account.accessToken,
      }
    : null;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: ["repo", "user", "read:org"],
    },
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          const github = toGithubAccount(account);
          if (github) await onFirstConnect(github);
        },
      },
      update: {
        after: async (account) => {
          const github = toGithubAccount(account);
          if (github) await onReconnect(github);
        },
      },
    },
  },
  plugins: [nextCookies()],
});
