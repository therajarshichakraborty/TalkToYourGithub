"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Repository } from "@/lib/github/types";

const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const OTHER_COLOR = "var(--chart-other)";
const TOP_N = SERIES.length;

interface Slice {
  name: string;
  count: number;
  share: number;
  color: string;
}

function toSlices(repositories: Repository[]): Slice[] {
  const counts = new Map<string, number>();
  for (const repo of repositories) {
    const key = repo.language ?? "Unspecified";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const ranked = [...counts.entries()]
    .filter(([name]) => name !== "Unspecified")
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = ranked.slice(0, TOP_N);
  const otherCount = repositories.length - top.reduce((sum, [, n]) => sum + n, 0);
  const total = repositories.length || 1;

  const slices = top.map(([name, count], i) => ({
    name,
    count,
    share: count / total,
    color: SERIES[i],
  }));
  if (otherCount > 0) {
    slices.push({
      name: "Other",
      count: otherCount,
      share: otherCount / total,
      color: OTHER_COLOR,
    });
  }
  return slices;
}

const pct = (share: number) => `${Math.round(share * 100)}%`;

export function LanguageBreakdown({
  repositories,
  isLoading,
}: {
  repositories: Repository[];
  isLoading: boolean;
}) {
  const slices = useMemo(() => toSlices(repositories), [repositories]);

  return (
    <section className='flex flex-col rounded-xl border bg-card p-5'>
      <header className='mb-5'>
        <h2 className='text-sm font-medium'>Primary languages</h2>
        <p className='text-xs text-muted-foreground'>
          Share of repositories by primary language
        </p>
      </header>

      {isLoading ? (
        <div className='space-y-4'>
          <Skeleton className='h-3 w-full rounded-full' />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className='h-4 w-full' />
          ))}
        </div>
      ) : slices.length === 0 ? (
        <p className='text-sm text-muted-foreground'>No repositories yet.</p>
      ) : (
        <TooltipProvider>
          <div
            role='img'
            aria-label={slices.map((s) => `${s.name} ${pct(s.share)}`).join(", ")}
            className='flex h-3 w-full gap-0.5 overflow-hidden rounded-full'
          >
            {slices.map((slice) => (
              <Tooltip key={slice.name}>
                <TooltipTrigger asChild>
                  <span
                    className='h-full cursor-default transition-opacity first:rounded-l-full last:rounded-r-full hover:opacity-80'
                    style={{
                      width: `${slice.share * 100}%`,
                      minWidth: 4,
                      backgroundColor: slice.color,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {slice.name}: {slice.count} repositories ({pct(slice.share)})
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <ul className='mt-5 space-y-2.5'>
            {slices.map((slice) => (
              <li key={slice.name} className='flex items-center gap-2.5 text-sm'>
                <span
                  className='size-2.5 shrink-0 rounded-sm'
                  style={{ backgroundColor: slice.color }}
                  aria-hidden='true'
                />
                <span className='flex-1 truncate'>{slice.name}</span>
                <span className='font-mono text-xs tabular-nums text-muted-foreground'>
                  {slice.count}
                </span>
                <span className='w-10 text-right font-mono text-xs tabular-nums'>
                  {pct(slice.share)}
                </span>
              </li>
            ))}
          </ul>
        </TooltipProvider>
      )}
    </section>
  );
}
