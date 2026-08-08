/*
 * API route: /api/repositories
 * Description: Retrieves the list of connected GitHub repositories for the authenticated user
 * using Corsair DB search with Live API fallback.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRepositories } from "@/lib/tools/get-repositories";

export const runtime = "nodejs";

export async function GET() {
  /* Authenticate user session */
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    /* Fetch authenticated user's connected GitHub login */
    const [conn] = await db
      .select({ githubLogin: schema.githubConnections.githubLogin })
      .from(schema.githubConnections)
      .where(eq(schema.githubConnections.userId, session.user.id));

    const userGithubLogin =
      conn?.githubLogin ||
      session.user.name ||
      session.user.email?.split("@")[0] ||
      "";

    /* Fetch repositories for the authenticated user via getRepositories tool */
    const result = await getRepositories({
      userId: session.user.id,
      perPage: 100,
    });

    if (!result.success) {
      return Response.json(
        { error: (result as any).error || "Failed to fetch repositories." },
        { status: 500 },
      );
    }

    /* Standardize repository objects for UI consumption */
    const repositories = (result.repositories || [])
      .map((repoItem: any) => {
        /* Corsair entity objects encapsulate fields inside data or payload */
        const r = repoItem?.data || repoItem?.payload || repoItem || {};

        let fullName =
          r.full_name ||
          r.fullName ||
          r.repositoryFullName ||
          r.repository_full_name ||
          (r.owner && r.name
            ? `${typeof r.owner === "string" ? r.owner : r.owner.login || r.owner.name}/${r.name}`
            : "") ||
          "";

        let owner =
          r.owner?.login ||
          (typeof r.owner === "string" && r.owner !== "github"
            ? r.owner
            : "") ||
          r.repositoryOwner ||
          r.repository_owner ||
          r.owner_login ||
          r.ownerLogin ||
          "";

        let name = r.name || r.repositoryName || r.repository_name || "";

        if (fullName && fullName.includes("/")) {
          const parts = fullName.split("/");
          if (!owner) owner = parts[0];
          if (!name) name = parts[1];
        }

        /* Fallback owner to authenticated user's githubLogin if owner is missing or generic "github" */
        if (!owner || owner.toLowerCase() === "github") {
          owner = userGithubLogin;
        }

        const formattedFullName =
          owner && name ? `${owner}/${name}` : fullName || name;

        if (!name && !formattedFullName) {
          return null;
        }

        return {
          id: repoItem.id ? String(repoItem.id) : formattedFullName,
          owner: owner || userGithubLogin,
          name: name || formattedFullName || "repository",
          fullName: formattedFullName,
          description: r.description || "",
          defaultBranch:
            r.default_branch ||
            r.defaultBranch ||
            r.default_branch_name ||
            "main",
          language: r.language || "TypeScript",
          isPrivate: r.private ?? false,
          stars: r.stargazers_count ?? r.stars ?? 0,
          updatedAt: r.updated_at || r.updatedAt || null,
        };
      })
      .filter(Boolean);

    return Response.json({
      success: true,
      source: result.source,
      count: repositories.length,
      repositories,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/repositories] Error fetching repositories:", message);

    return Response.json(
      { error: "Internal server error while loading repositories." },
      { status: 500 },
    );
  }
}
