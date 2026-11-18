"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ChevronLeft, ChevronRight, Lock, Search, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { repositoryPath } from "@/lib/github/paths";
import type { Repository } from "@/lib/github/types";

const PAGE_SIZE = 12;

type Visibility = "all" | "public" | "private" | "forks";
type SortKey = "pushed" | "name" | "stars";

const VISIBILITY: Record<Visibility, (r: Repository) => boolean> = {
  all: () => true,
  public: (r) => !r.isPrivate,
  private: (r) => r.isPrivate,
  forks: (r) => r.isFork,
};

const SORTERS: Record<SortKey, (a: Repository, b: Repository) => number> = {
  pushed: (a, b) => (b.pushedAt ?? "").localeCompare(a.pushedAt ?? ""),
  name: (a, b) => a.name.localeCompare(b.name),
  stars: (a, b) => b.stars - a.stars || a.name.localeCompare(b.name),
};

function relative(date: string | null) {
  return date
    ? formatDistanceToNowStrict(new Date(date), { addSuffix: true })
    : "—";
}

export function RepositoryTable({
  repositories,
  isLoading,
}: {
  repositories: Repository[];
  isLoading: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [sort, setSort] = useState<SortKey>("pushed");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repositories
      .filter(VISIBILITY[visibility])
      .filter(
        (r) =>
          !q ||
          r.fullName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.language?.toLowerCase().includes(q),
      )
      .sort(SORTERS[sort]);
  }, [repositories, query, visibility, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const from = rows.length ? currentPage * PAGE_SIZE + 1 : 0;
  const to = Math.min((currentPage + 1) * PAGE_SIZE, rows.length);

  const resetPage = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  return (
    <section className='rounded-xl border bg-card'>
      <header className='flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <h2 className='text-sm font-medium'>All repositories</h2>
          <p className='text-xs text-muted-foreground'>
            {isLoading ? "Loading…" : `${rows.length} of ${repositories.length} shown`}
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <div className='relative'>
            <Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={query}
              onChange={(e) => resetPage(setQuery)(e.target.value)}
              placeholder='Search name, language…'
              aria-label='Search repositories'
              className='h-8 w-full pl-8 text-xs sm:w-56'
            />
          </div>
          <ToggleGroup
            type='single'
            variant='outline'
            size='sm'
            value={visibility}
            onValueChange={(v) => v && resetPage(setVisibility)(v as Visibility)}
            aria-label='Filter by visibility'
          >
            {(["all", "public", "private", "forks"] as const).map((v) => (
              <ToggleGroupItem key={v} value={v} className='px-3 text-xs capitalize'>
                {v}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={sort} onValueChange={(v) => resetPage(setSort)(v as SortKey)}>
            <SelectTrigger size='sm' className='w-full text-xs sm:w-40' aria-label='Sort'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='pushed'>Recently pushed</SelectItem>
              <SelectItem value='name'>Name</SelectItem>
              <SelectItem value='stars'>Most stars</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='border-b text-left text-xs text-muted-foreground'>
              <th className='px-5 py-2.5 font-medium'>Repository</th>
              <th className='hidden px-3 py-2.5 font-medium md:table-cell'>Language</th>
              <th className='hidden px-3 py-2.5 text-right font-medium sm:table-cell'>Stars</th>
              <th className='px-5 py-2.5 text-right font-medium'>Last push</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className='border-b last:border-0'>
                  <td className='px-5 py-3.5' colSpan={4}>
                    <Skeleton className='h-4 w-full' />
                  </td>
                </tr>
              ))}

            {!isLoading && visible.length === 0 && (
              <tr>
                <td colSpan={4} className='px-5 py-12 text-center text-sm text-muted-foreground'>
                  No repositories match these filters.
                </td>
              </tr>
            )}

            {!isLoading &&
              visible.map((repo) => {
                const href = repositoryPath(repo.owner, repo.name);
                return (
                  <tr
                    key={repo.id}
                    onClick={() => router.push(href)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(href)}
                    tabIndex={0}
                    className='cursor-pointer border-b outline-none transition-colors last:border-0 hover:bg-accent/50 focus-visible:bg-accent/50'
                  >
                    <td className='max-w-0 px-5 py-3'>
                      <div className='flex items-center gap-2'>
                        <span className='truncate font-medium'>{repo.name}</span>
                        {repo.isPrivate && <Lock className='size-3 shrink-0 text-muted-foreground' />}
                        {repo.isArchived && (
                          <Badge variant='outline' className='h-4 px-1.5 text-[10px]'>
                            Archived
                          </Badge>
                        )}
                      </div>
                      <p className='truncate text-xs text-muted-foreground'>
                        {repo.description || repo.owner}
                      </p>
                    </td>
                    <td className='hidden whitespace-nowrap px-3 py-3 text-xs text-muted-foreground md:table-cell'>
                      {repo.language ?? "—"}
                    </td>
                    <td className='hidden px-3 py-3 text-right sm:table-cell'>
                      <span className='inline-flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground'>
                        <Star className='size-3' />
                        {repo.stars}
                      </span>
                    </td>
                    <td className='whitespace-nowrap px-5 py-3 text-right text-xs text-muted-foreground'>
                      {relative(repo.pushedAt)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <footer className='flex items-center justify-between border-t px-5 py-3'>
        <span className='text-xs tabular-nums text-muted-foreground'>
          {rows.length ? `${from}–${to} of ${rows.length}` : "0 results"}
        </span>
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label='Previous page'
          >
            <ChevronLeft />
          </Button>
          <span className='px-2 font-mono text-xs tabular-nums text-muted-foreground'>
            {currentPage + 1} / {pageCount}
          </span>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= pageCount - 1}
            aria-label='Next page'
          >
            <ChevronRight />
          </Button>
        </div>
      </footer>
    </section>
  );
}
