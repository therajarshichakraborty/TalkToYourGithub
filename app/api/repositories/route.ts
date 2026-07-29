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
    const repositories = (result.repositories || []).map((repo: any) => {
      const fullName = repo.full_name || repo.fullName || "";
      const parts = fullName.split("/");
      const owner = repo.owner?.login || repo.owner || parts[0] || "";
      const name = repo.name || parts[1] || "";

      return {
        id: repo.id ? String(repo.id) : `${owner}/${name}`,
        owner,
        name,
        fullName: fullName || `${owner}/${name}`,
        description: repo.description || "",
        defaultBranch: repo.default_branch || repo.defaultBranch || "main",
        language: repo.language || "Unknown",
        isPrivate: repo.private ?? false,
        stars: repo.stargazers_count ?? repo.stars ?? 0,
        updatedAt: repo.updated_at || repo.updatedAt || null,
      };
    });

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
