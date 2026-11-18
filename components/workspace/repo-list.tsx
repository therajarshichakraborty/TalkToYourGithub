"use client";

import { Lock, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { repositoryPath } from "@/lib/github/paths";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-provider";

export function RepoList() {
  const { repositories, isLoading, isRefreshing, error, refresh } = useWorkspace();
  const [query, setQuery] = useState("");
  const pathname = usePathname();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return repositories;
    return repositories.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q),
    );
  }, [repositories, query]);

  return (
    <SidebarGroup className='min-h-0 flex-1'>
      <SidebarGroupLabel>
        Repositories
        <span className='ml-1.5 font-mono tabular-nums text-sidebar-foreground/50'>
          {isLoading ? "" : repositories.length}
        </span>
      </SidebarGroupLabel>
      <SidebarGroupAction
        onClick={() => void refresh()}
        disabled={isRefreshing}
        title='Reload repositories from GitHub'
        aria-label='Reload repositories'
      >
        <RefreshCw className={cn(isRefreshing && "animate-spin")} />
      </SidebarGroupAction>

      <div className='relative px-2 pb-2 pt-1'>
        <Search className='pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Filter repositories'
          aria-label='Filter repositories'
          className='h-8 bg-background pl-8 text-xs'
        />
      </div>

      <SidebarGroupContent className='min-h-0 flex-1 overflow-y-auto'>
        <SidebarMenu>
          {isLoading &&
            Array.from({ length: 8 }, (_, i) => (
              <SidebarMenuItem key={i}>
                <SidebarMenuSkeleton />
              </SidebarMenuItem>
            ))}

          {!isLoading && error && (
            <p className='px-2 py-3 text-xs text-destructive'>{error}</p>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <p className='px-2 py-3 text-xs text-muted-foreground'>
              {query ? "No repositories match." : "No repositories found."}
            </p>
          )}

          {!isLoading &&
            filtered.map((repo) => {
              const href = repositoryPath(repo.owner, repo.name);
              const active = pathname.toLowerCase() === href.toLowerCase();
              return (
                <SidebarMenuItem key={repo.id}>
                  <SidebarMenuButton asChild isActive={active} size='sm'>
                    <Link href={href} title={repo.fullName}>
                      <span className='truncate'>{repo.name}</span>
                      {repo.isPrivate && (
                        <Lock className='ml-auto size-3! shrink-0 text-muted-foreground' />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
