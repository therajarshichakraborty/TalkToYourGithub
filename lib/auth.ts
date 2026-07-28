import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
import { corsair } from "@/server/corsair";
import { eq } from "drizzle-orm";

async function provisionCorsairTenant({
  userId,
  githubUserId,
  accessToken,
}: {
  userId: string;
  githubUserId: string;
  accessToken: string;
}) {
  const tenantId = githubUserId;

  // 1. Persist corsair_tenant_id on users table
  await db
    .update(schema.user)
    .set({ corsairTenantId: tenantId })
    .where(eq(schema.user.id, userId));

  // 2. Provision Corsair tenant vault with GitHub OAuth access token
  const tenant = corsair.withTenant(tenantId);
  if (tenant?.github?.keys?.set_api_key) {
    await tenant.github.keys.set_api_key(accessToken);
  }

  // 3. Upsert githubConnections record
  let githubLogin = githubUserId;
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "TalkToYourGithubApp",
      },
    });
    if (res.ok) {
      const userData = await res.json();
      if (userData.login) {
        githubLogin = userData.login;
      }
    }
  } catch (err) {
    console.error("[Corsair] Failed to fetch GitHub profile login:", err);
  }

  await db
    .insert(schema.githubConnections)
    .values({
      userId,
      githubUserId,
      githubLogin,
    })
    .onConflictDoNothing();

  console.log(
    `[Corsair] Provisioned tenant '${tenantId}' for user '${userId}' (GitHub login: ${githubLogin})`
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          if (account.providerId === "github" && account.accessToken) {
            await provisionCorsairTenant({
              userId: account.userId,
              githubUserId: account.accountId,
              accessToken: account.accessToken,
            });
          }
        },
      },
      update: {
        after: async (account) => {
          if (account.providerId === "github" && account.accessToken) {
            await provisionCorsairTenant({
              userId: account.userId,
              githubUserId: account.accountId,
              accessToken: account.accessToken,
            });
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
});

