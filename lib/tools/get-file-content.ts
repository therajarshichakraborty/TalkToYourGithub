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

  const { tenant } = await getCorsairTenantClient(options);
  const targetFullName = `${options.owner}/${options.repo}/${targetPath}`;

  try {
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
          source: "live_api",
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

      if (Array.isArray(res) || ("type" in res && res.type === "dir")) {
        const items = Array.isArray(res) ? res : [];
        return {
          success: true,
          source: "live_api",
          owner: options.owner,
          repo: options.repo,
          path: options.path,
          ref: options.ref || "default",
          type: "directory",
          itemCount: items.length,
          items: items.map((item) => ({
            name: item.name,
            path: item.path,
            type: item.type,
            sha: item.sha,
            size: item.size,
          })),
        };
      }
    }
  } catch (apiErr: unknown) {
    const errMsg = apiErr instanceof Error ? apiErr.message : String(apiErr);
    const isRateLimited =
      errMsg.toLowerCase().includes("rate limit") ||
      errMsg.includes("403") ||
      errMsg.includes("429");

    console.warn(
      `[getFileContent] Live API call note for ${targetFullName}:`,
      errMsg,
      isRateLimited ? "(Rate Limit Detected)" : "",
    );

    return {
      success: false,
      owner: options.owner,
      repo: options.repo,
      path: options.path,
      isRateLimited,
      error: isRateLimited
        ? `GitHub API rate limit exceeded while fetching '${targetFullName}'.`
        : `Could not fetch content for '${targetFullName}': ${errMsg}`,
      content: null,
    };
  }

  return {
    success: false,
    owner: options.owner,
    repo: options.repo,
    path: options.path,
    error: `No content returned for '${targetFullName}' via Live API.`,
    content: null,
  };
}
