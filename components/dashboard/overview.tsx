"use client";

import {
  Activity,
  CircleDot,
  FolderGit2,
  MessageSquareText,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { LanguageBreakdown } from "./language-breakdown";
import { RecentActivity } from "./recent-activity";
import { RepositoryTable } from "./repository-table";
import { StatTile } from "./stat-tile";

const DAY_MS = 24 * 60 * 60 * 1000;
const number = new Intl.NumberFormat("en");

const subscribe = () => () => {};

function localGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Overview() {
  const { user, repositories, isLoading } = useWorkspace();
  const greeting = useSyncExternalStore(
    subscribe,
    localGreeting,
    () => "Welcome back",
  );

  const [now] = useState(() => Date.now());

  const stats = useMemo(() => {
    const cutoff = now - 30 * DAY_MS;
    const privateCount = repositories.filter((r) => r.isPrivate).length;
    return {
      total: repositories.length,
      privateCount,
      publicCount: repositories.length - privateCount,
      stars: repositories.reduce((sum, r) => sum + r.stars, 0),
      openItems: repositories.reduce((sum, r) => sum + r.openIssues, 0),
      active: repositories.filter(
        (r) => r.pushedAt && new Date(r.pushedAt).getTime() >= cutoff,
      ).length,
    };
  }, [repositories, now]);

  return (
    <div className='mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8'>
      <div className='flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {greeting}, {user.name.split(" ")[0]}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Here is what is happening across your repositories.
          </p>
        </div>
        <Button asChild className='shadow-button h-9 gap-2'>
          <Link href='/chat'>
            <MessageSquareText className='size-4' />
            Ask the assistant
          </Link>
        </Button>
      </div>

      <div className='grid gap-4 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 delay-75 sm:grid-cols-2 xl:grid-cols-4'>
        <StatTile
          label='Repositories'
          icon={FolderGit2}
          value={number.format(stats.total)}
          detail={`${stats.publicCount} public · ${stats.privateCount} private`}
          isLoading={isLoading}
        />
        <StatTile
          label='Active this month'
          icon={Activity}
          value={number.format(stats.active)}
          detail='Pushed to in the last 30 days'
          isLoading={isLoading}
        />
        <StatTile
          label='Open issues & PRs'
          icon={CircleDot}
          value={number.format(stats.openItems)}
          detail='Across all repositories'
          isLoading={isLoading}
        />
        <StatTile
          label='Stars'
          icon={Star}
          value={number.format(stats.stars)}
          detail='Total stargazers'
          isLoading={isLoading}
        />
      </div>

      <div className='grid gap-4 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 delay-150 lg:grid-cols-[1fr_1.4fr]'>
        <LanguageBreakdown repositories={repositories} isLoading={isLoading} />
        <RecentActivity />
      </div>

      <div className='animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-500 delay-200'>
        <RepositoryTable repositories={repositories} isLoading={isLoading} />
      </div>
    </div>
  );
}
