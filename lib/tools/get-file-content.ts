import { getCorsairTenantClient, ToolContextOptions } from "./helper";

export interface GetFileContentOptions extends ToolContextOptions {
  owner: string;
  repo: string;
  path: string;
  ref?: string;
}

export async function getFileContent(options: GetFileContentOptions) {
  const targetPath = options.path !== undefined && options.path !== null ? options.path : "";
  if (!options.owner || !options.repo) {
    throw new Error(
      "Parameters 'owner' and 'repo' are required to fetch file content.",
    );
  }

  const targetFullName = `${options.owner}/${options.repo}/${targetPath}`;

  // 1. Try Corsair API
  try {
    const { tenant } = await getCorsairTenantClient(options);
    const res = await tenant.github.api.repositories.getContent({
      owner: options.owner,
      repo: options.repo,
      path: targetPath,
      ref: options.ref,
    });

    if (res) {
      if (!Array.isArray(res) && "type" in res && res.type === "file") {
        let contentStr = res.content || "";
        if (res.encoding === "base64" && contentStr) {
          contentStr = Buffer.from(contentStr, "base64").toString("utf-8");
        }

        const publicUrl =
          res.htmlUrl ||
          `https://github.com/${options.owner}/${options.repo}/blob/${options.ref || "main"}/${options.path}`;

        return {
          success: true,
          source: "corsair_api",
          owner: options.owner,
          repo: options.repo,
          path: options.path,
          ref: options.ref || "default",
          type: "file",
          name: res.name,
          sha: res.sha,
          size: res.size,
          encoding: res.encoding,
          downloadUrl: res.downloadUrl ?? null,
          htmlUrl: res.htmlUrl ?? null,
          publicUrl,
          content: contentStr,
        };
      }
    }
  } catch (corsairErr: unknown) {
    console.warn(
      `[getFileContent] Corsair API note for ${targetFullName}:`,
      corsairErr instanceof Error ? corsairErr.message : corsairErr,
    );
  }

  // 2. Direct GitHub REST API Fallback
  try {
    const token = process.env.GITHUB_TOKEN;
    const reqHeaders: Record<string, string> = {
      "User-Agent": "TalkToYourGithub",
      Accept: "application/vnd.github.v3+json",
    };
    if (token) {
      reqHeaders.Authorization = `Bearer ${token}`;
    }

    const refQuery = options.ref ? `?ref=${options.ref}` : "";
    const ghRes = await fetch(
      `https://api.github.com/repos/${options.owner}/${options.repo}/contents/${targetPath}${refQuery}`,
      { headers: reqHeaders },
    );

    if (ghRes.ok) {
      const data = await ghRes.json();
      if (data && data.type === "file" && data.content) {
        let contentStr = data.content;
        if (data.encoding === "base64") {
          contentStr = Buffer.from(contentStr, "base64").toString("utf-8");
        }
        return {
          success: true,
          source: "github_rest",
          owner: options.owner,
          repo: options.repo,
          path: options.path,
          ref: options.ref || "default",
          type: "file",
          name: data.name,
          sha: data.sha,
          size: data.size,
          encoding: data.encoding,
          downloadUrl: data.download_url ?? null,
          htmlUrl: data.html_url ?? null,
          publicUrl: data.html_url || `https://github.com/${options.owner}/${options.repo}/blob/${options.ref || "main"}/${options.path}`,
          content: contentStr,
        };
      }
    }
  } catch (restErr: unknown) {
    console.warn(
      `[getFileContent] GitHub REST API fallback note for ${targetFullName}:`,
      restErr instanceof Error ? restErr.message : restErr,
    );
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    path: options.path,
    error: `Could not fetch content for '${targetFullName}'.`,
    content: null,
  };
}

