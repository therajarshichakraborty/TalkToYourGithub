"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
  Activity,
  CircleDot,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { repositoryPath } from "@/lib/github/paths";

interface ActivityGroup {
  owner: string;
  name: string;
  fullName: string;
  latestActivityAt: string;
  activities: Array<{
    id: string;
    type: string;
    title: string | null;
    occurredAt: string;
  }>;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  commit: GitCommitHorizontal,
  pr: GitPullRequest,
  issue: CircleDot,
  chat: MessageSquareText,
  review: Sparkles,
};

export function RecentActivity() {
  const [groups, setGroups] = useState<ActivityGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/continue-working", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load activity.");
        if (!cancelled) setGroups(data.repositories ?? []);
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className='flex flex-col rounded-xl border bg-card'>
      <header className='border-b px-5 py-4'>
        <h2 className='text-sm font-medium'>Pick up where you left off</h2>
        <p className='text-xs text-muted-foreground'>
          Repositories with recent activity and conversations
        </p>
      </header>

      <div className='flex-1 divide-y'>
        {groups === null && !error &&
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className='space-y-2 px-5 py-4'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-3 w-full' />
            </div>
          ))}

        {error && <p className='px-5 py-6 text-sm text-destructive'>{error}</p>}

        {groups?.length === 0 && (
          <div className='flex flex-col items-center gap-2 px-5 py-12 text-center'>
            <Activity className='size-5 text-muted-foreground' />
            <p className='text-sm font-medium'>No activity yet</p>
            <p className='max-w-xs text-xs text-muted-foreground'>
              Open a repository and ask a question, or run a sync to import
              recent commits, pull requests and issues.
            </p>
          </div>
        )}

        {groups?.map((group) => (
          <Link
            key={group.fullName}
            href={repositoryPath(group.owner, group.name)}
            className='block px-5 py-4 transition-colors hover:bg-accent/50'
          >
            <div className='flex items-center justify-between gap-3'>
              <span className='truncate text-sm font-medium'>{group.fullName}</span>
              <span className='shrink-0 text-xs text-muted-foreground'>
                {formatDistanceToNowStrict(new Date(group.latestActivityAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <ul className='mt-2 space-y-1.5'>
              {group.activities.slice(0, 2).map((item) => {
                const Icon = ICONS[item.type] ?? Activity;
                return (
                  <li
                    key={item.id}
                    className='flex items-center gap-2 text-xs text-muted-foreground'
                  >
                    <Icon className='size-3.5 shrink-0' />
                    <span className='truncate'>{item.title ?? "Activity"}</span>
                  </li>
                );
              })}
            </ul>
          </Link>
        ))}
      </div>
    </section>
  );
}
