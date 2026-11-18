"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
  CircleDot,
  Copy,
  ExternalLink,
  GitCommitHorizontal,
  GitPullRequest,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/chat/markdown-renderer";
import type { Commit, Issue, PullRequest } from "@/lib/github/types";

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className='overflow-hidden rounded-xl border bg-card'>
      <header className='flex items-center justify-between gap-3 border-b px-5 py-3.5'>
        <div className='min-w-0'>
          <h2 className='text-sm font-medium'>{title}</h2>
          {description && (
            <p className='truncate text-xs text-muted-foreground'>
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className='px-5 py-8 text-center text-sm text-muted-foreground'>
      {children}
    </p>
  );
}

const ago = (date: string) =>
  formatDistanceToNowStrict(new Date(date), { addSuffix: true });

export function SummaryPanel({
  summary,
  generatedAt,
}: {
  summary: string | null;
  generatedAt: string | null;
}) {
  const copy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    toast.success("Summary copied");
  };

  return (
    <Panel
      title='AI summary'
      description={generatedAt ? `Generated ${ago(generatedAt)}` : undefined}
      action={
        summary && (
          <button
            type='button'
            onClick={copy}
            aria-label='Copy summary'
            className='inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
          >
            <Copy className='size-3.5' />
          </button>
        )
      }
    >
      {summary ? (
        <div className='space-y-3 px-5 py-4 text-sm leading-relaxed'>
          {summary
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </div>
      ) : (
        <div className='flex flex-col items-center gap-2 px-5 py-8 text-center'>
          <Sparkles className='size-5 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>
            No summary yet. Use “Sync insights” to generate one.
          </p>
        </div>
      )}
    </Panel>
  );
}

export function CommitsPanel({
  commits,
  url,
}: {
  commits: Commit[];
  url: string;
}) {
  return (
    <Panel title='Recent commits' action={<ViewAll href={`${url}/commits`} />}>
      {commits.length === 0 ? (
        <Empty>No commits yet.</Empty>
      ) : (
        <ul className='divide-y'>
          {commits.map((c) => (
            <li key={c.sha} className='flex items-center gap-3 px-5 py-2.5'>
              <GitCommitHorizontal className='size-4 shrink-0 text-muted-foreground' />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm'>{c.message}</p>
                <p className='text-xs text-muted-foreground'>
                  {c.author} · {c.date ? ago(c.date) : "unknown date"}
                </p>
              </div>
              <a
                href={`${url}/commit/${c.sha}`}
                target='_blank'
                rel='noreferrer'
                className='font-mono text-xs text-muted-foreground hover:text-foreground'
              >
                {c.sha}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function WorkItemsPanel({
  title,
  items,
  emptyLabel,
  kind,
  href,
}: {
  title: string;
  items: Array<PullRequest | Issue>;
  emptyLabel: string;
  kind: "pr" | "issue";
  href: string;
}) {
  const Icon = kind === "pr" ? GitPullRequest : CircleDot;
  return (
    <Panel title={title} action={<ViewAll href={href} />}>
      {items.length === 0 ? (
        <Empty>{emptyLabel}</Empty>
      ) : (
        <ul className='divide-y'>
          {items.slice(0, 6).map((item) => (
            <li key={item.number}>
              <a
                href={item.url}
                target='_blank'
                rel='noreferrer'
                className='flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-accent/50'
              >
                <Icon className='size-4 shrink-0 text-success' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm'>{item.title}</p>
                  <p className='text-xs text-muted-foreground'>
                    #{item.number} · {item.author} · updated{" "}
                    {ago(item.updatedAt)}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function ReadmePanel({ readme, url }: { readme: string; url: string }) {
  return (
    <Panel title='README.md' action={<ViewAll href={`${url}#readme`} />}>
      <div className='relative max-h-140 overflow-hidden px-5 py-4'>
        <MarkdownRenderer content={readme} />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-card to-transparent' />
      </div>
    </Panel>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noreferrer'
      className='inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
    >
      GitHub
      <ExternalLink className='size-3' />
    </a>
  );
}
