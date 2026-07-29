/*
 * API route: /api/repositories
 * Description: Retrieves the list of connected GitHub repositories for the authenticated user
 * using Corsair DB search with Live API fallback.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getRepositories } from "@/lib/tools/get-repositories";

export const runtime = "nodejs";

export async function GET() {
  /* Authenticate user session */
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return Response.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }

  try {
    /* Fetch repositories for the authenticated user via getRepositories tool */
    const result = await getRepositories({
      userId: session.user.id,
      perPage: 100,
    });

    if (!result.success) {
      return Response.json(
        { error: result.error || "Failed to fetch repositories." },
        { status: 500 }
      );
    }

    /* Standardize repository objects for UI consumption */
    const repositories = (result.repositories || [])
      .map((repoItem: any) => {
        /* Corsair entity objects encapsulate fields inside data or payload */
        const r = repoItem?.data || repoItem?.payload || repoItem || {};

        const fullName =
          r.full_name ||
          r.fullName ||
          r.repositoryFullName ||
          r.repository_full_name ||
          (r.owner && r.name ? `${typeof r.owner === "string" ? r.owner : r.owner.login}/${r.name}` : "") ||
          "";

        const parts = fullName.split("/");

        const owner =
          r.owner?.login ||
          (typeof r.owner === "string" ? r.owner : "") ||
          r.repositoryOwner ||
          r.repository_owner ||
          parts[0] ||
          "";

        const name =
          r.name ||
          r.repositoryName ||
          r.repository_name ||
          parts[1] ||
          "";

        const formattedFullName = fullName || (owner && name ? `${owner}/${name}` : name);

        if (!name && !formattedFullName) {
          return null;
        }

        return {
          id: repoItem.id ? String(repoItem.id) : formattedFullName,
          owner: owner || "github",
          name: name || formattedFullName || "repository",
          fullName: formattedFullName,
          description: r.description || "",
          defaultBranch: r.default_branch || r.defaultBranch || r.default_branch_name || "main",
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
      { status: 500 }
    );
  }
}
