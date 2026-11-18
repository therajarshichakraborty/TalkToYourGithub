"use client";

import { useCallback, useEffect, useState } from "react";
import type { Commit, Issue, PullRequest } from "@/lib/github/types";

export interface RepositoryDetails {
  repo: {
    owner: string;
    name: string;
    fullName: string;
    description: string;
    defaultBranch: string;
    language: string | null;
    isPrivate: boolean;
    htmlUrl: string;
    pushedAt: string | null;
    topics: string[];
  };
  stats: {
    stars: number;
    forks: number;
    branches: number;
    openPullRequests: number;
    openIssues: number;
  };
  summary: string | null;
  summaryGeneratedAt: string | null;
  commits: Commit[];
  pullRequests: PullRequest[];
  issues: Issue[];
  branches: string[];
  readme: string | null;
  activity: Array<{
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    occurredAt: string;
  }>;
}

async function fetchDetails(
  owner: string,
  name: string,
  signal?: AbortSignal,
): Promise<RepositoryDetails> {
  const res = await fetch(
    `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    { cache: "no-store", signal },
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Could not load repository.");
  return body as RepositoryDetails;
}

export function useRepositoryDetails(owner: string, name: string) {
  const [data, setData] = useState<RepositoryDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetails(owner, name, controller.signal)
      .then(setData)
      .catch((err: Error) => !controller.signal.aborted && setError(err.message))
      .finally(() => !controller.signal.aborted && setIsLoading(false));
    return () => controller.abort();
  }, [owner, name]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetchDetails(owner, name));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [owner, name]);

  return { data, error, isLoading, reload };
}
