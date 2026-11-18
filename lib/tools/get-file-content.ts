import {
  githubGet,
  repoPath,
  toErrorMessage,
  type GithubAuthContext,
} from "@/lib/github/client";
import type { DirectoryEntry } from "@/lib/github/types";

export interface GetFileContentOptions extends GithubAuthContext {
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
  maxChars?: number;
}

interface RawContentItem {
  name: string;
  path: string;
  type: DirectoryEntry["type"];
  size: number;
  html_url: string | null;
  content?: string;
  encoding?: string;
}

const DEFAULT_MAX_CHARS = 6000;

export async function getFileContent({
  owner,
  repo,
  path = "",
  ref,
  maxChars = DEFAULT_MAX_CHARS,
  ...ctx
}: GetFileContentOptions) {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const segments = cleanPath ? cleanPath.split("/") : [];

  try {
    if (segments.some((s) => s === "." || s === ".." || s === "")) {
      throw new Error(`Invalid path "${path}".`);
    }

    const data = await githubGet<RawContentItem | RawContentItem[]>(
      ctx,
      repoPath(
        owner,
        repo,
        `/contents/${segments.map(encodeURIComponent).join("/")}`,
      ),
      { ref: ref || undefined },
    );

    if (Array.isArray(data)) {
      const items: DirectoryEntry[] = data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
      }));
      return {
        success: true as const,
        type: "directory" as const,
        owner,
        repo,
        path: cleanPath,
        ref: ref ?? null,
        items,
      };
    }

    if (data.encoding === "none") {
      return {
        success: false as const,
        owner,
        repo,
        path: data.path,
        error: `${data.path} is too large to read (${data.size} bytes).`,
        content: null,
      };
    }

    const decoded =
      data.encoding === "base64" && data.content
        ? Buffer.from(data.content, "base64").toString("utf-8")
        : (data.content ?? "");
    const truncated = decoded.length > maxChars;

    return {
      success: true as const,
      type: "file" as const,
      owner,
      repo,
      path: data.path,
      ref: ref ?? null,
      name: data.name,
      size: data.size,
      url: data.html_url,
      truncated,
      content: truncated ? decoded.slice(0, maxChars) : decoded,
    };
  } catch (error) {
    return {
      success: false as const,
      owner,
      repo,
      path: cleanPath,
      error: toErrorMessage(error),
      content: null,
    };
  }
}
