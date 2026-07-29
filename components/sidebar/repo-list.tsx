/*
 * Component: RepoList
 * Description: Displays a filterable list of GitHub repositories fetched from /api/repositories.
 * Allows users to search and select an active repository context for AI interactions.
 */

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Search,
  FolderGit2,
  Star,
  GitBranch,
  Check,
  RefreshCw,
} from "lucide-react";

/*
 * Repository interface representing repository data returned by the API
 */
export interface RepositoryItem {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  language: string;
  isPrivate: boolean;
  stars: number;
  updatedAt?: string | null;
}

interface RepoListProps {
  selectedRepo: RepositoryItem | null;
  onSelectRepo: (repo: RepositoryItem | null) => void;
}

export function RepoList({ selectedRepo, onSelectRepo }: RepoListProps) {
  /* Repository state storage */
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  /*
   * Fetch connected repositories from /api/repositories on mount
   */
  const fetchRepositories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/repositories");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load repositories.");
      }

      setRepositories(data.repositories || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching repositories.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  /*
   * Filter repositories dynamically based on user search query
   */
  const filteredRepos = useMemo(() => {
    if (!searchQuery.trim()) return repositories;
    const query = searchQuery.toLowerCase();
    return repositories.filter(
      (repo) =>
        repo.fullName.toLowerCase().includes(query) ||
        repo.description.toLowerCase().includes(query) ||
        repo.language.toLowerCase().includes(query)
    );
  }, [repositories, searchQuery]);

  return (
    <SidebarGroup className="py-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground p-0">
          Repositories ({filteredRepos.length})
        </SidebarGroupLabel>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={fetchRepositories}
          title="Refresh repositories"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Repository Search Filter */}
      <div className="px-2 mb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search repos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-sidebar-accent/50 border-sidebar-border"
          />
        </div>
      </div>

      {/* Selected Repository Clear Option */}
      {selectedRepo && (
        <div className="px-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectRepo(null)}
            className="w-full text-xs h-7 justify-between text-muted-foreground hover:text-foreground"
          >
            <span>Clear selection</span>
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
              All repos
            </span>
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2 px-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-md">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {!isLoading && error && (
        <div className="px-2 py-3 text-xs text-destructive text-center">
          <p>{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRepositories}
            className="mt-2 h-7 text-xs"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredRepos.length === 0 && (
        <div className="px-3 py-6 text-center text-xs text-muted-foreground">
          <FolderGit2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No repositories found</p>
          {searchQuery && (
            <p className="text-[11px] mt-1 text-muted-foreground/70">
              Try a different search term
            </p>
          )}
        </div>
      )}

      {/* Repository List */}
      {!isLoading && !error && filteredRepos.length > 0 && (
        <SidebarGroupContent>
          <SidebarMenu className="space-y-0.5">
            {filteredRepos.map((repo) => {
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <SidebarMenuItem key={repo.id}>
                  <SidebarMenuButton
                    onClick={() => onSelectRepo(repo)}
                    isActive={isSelected}
                    className="w-full flex items-start gap-2.5 py-2 px-2.5 h-auto text-left rounded-md transition-colors"
                  >
                    <FolderGit2 className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-xs truncate">
                          {repo.name}
                        </span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {repo.owner}
                      </div>

                      {/* Meta badges for language & stats */}
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                        {repo.language && (
                          <span className="truncate max-w-[80px]">
                            {repo.language}
                          </span>
                        )}
                        {repo.defaultBranch && (
                          <span className="flex items-center gap-0.5">
                            <GitBranch className="h-2.5 w-2.5" />
                            {repo.defaultBranch}
                          </span>
                        )}
                        {repo.stars > 0 && (
                          <span className="flex items-center gap-0.5 ml-auto">
                            <Star className="h-2.5 w-2.5 fill-current text-amber-500" />
                            {repo.stars}
                          </span>
                        )}
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}
