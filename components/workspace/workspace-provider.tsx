"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { Repository } from "@/lib/github/types";

export interface WorkspaceUser {
  name: string;
  email: string;
  image?: string | null;
}

interface WorkspaceContextValue {
  user: WorkspaceUser;
  repositories: Repository[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  findRepository: (owner: string, name: string) => Repository | undefined;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

async function fetchRepositories(force: boolean): Promise<Repository[]> {
  const res = await fetch(`/api/repositories${force ? "?refresh=1" : ""}`, {
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    repositories?: Repository[];
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Could not load repositories.");
  return data.repositories ?? [];
}

export function WorkspaceProvider({
  user,
  children,
}: {
  user: WorkspaceUser;
  children: React.ReactNode;
}) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const requestSeq = useRef(0);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const seq = ++requestSeq.current;
    setIsRefreshing(true);
    try {
      const repos = await fetchRepositories(true);
      if (seq !== requestSeq.current) return;
      setRepositories(repos);
      setError(null);
      toast.success(`Synced ${repos.length} repositories`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      inFlight.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const seq = ++requestSeq.current;
    const isCurrent = () => active && seq === requestSeq.current;
    fetchRepositories(false)
      .then((repos) => isCurrent() && setRepositories(repos))
      .catch((err: Error) => isCurrent() && setError(err.message))
      .finally(() => isCurrent() && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      user,
      repositories,
      isLoading,
      isRefreshing,
      error,
      refresh,
      findRepository: (owner, name) =>
        repositories.find(
          (r) =>
            r.owner.toLowerCase() === owner.toLowerCase() &&
            r.name.toLowerCase() === name.toLowerCase(),
        ),
    }),
    [user, repositories, isLoading, isRefreshing, error, refresh],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
