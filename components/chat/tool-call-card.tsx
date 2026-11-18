"use client";

import {
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileCode2,
  Folder,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type {
  Commit,
  DirectoryEntry,
  Issue,
  PullRequest,
} from "@/lib/github/types";
import { cn } from "@/lib/utils";

export interface ToolInvocationView {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "partial-call" | "call" | "result";
  result?: unknown;
}

const LABELS: Record<string, string> = {
  getRepositories: "Listed repositories",
  getBranches: "Read branches",
  getCommits: "Read commits",
  getPullRequests: "Read pull requests",
  getIssues: "Read issues",
  getFileContent: "Read files",
  reviewPullRequest: "Reviewed pull request",
  getRepositorySummary: "Loaded summary",
  getProjectMemory: "Searched project memory",
  createIssue: "Created issue",
  draftIssue: "Drafted issue",
};

interface IssueDraft {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels: string[];
}

function DraftIssue({ draft }: { draft: IssueDraft }) {
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [url, setUrl] = useState<string | null>(null);

  const create = async () => {
    setState("pending");
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the issue.");
      setUrl(data.issue.url);
      setState("done");
      toast.success(`Issue #${data.issue.number} created`);
    } catch (error) {
      setState("idle");
      toast.error(error instanceof Error ? error.message : "Could not create the issue.");
    }
  };

  return (
    <div className='space-y-3 p-3 text-xs'>
      <p className='font-mono text-muted-foreground'>
        {draft.owner}/{draft.repo}
      </p>
      <p className='text-sm font-medium'>{draft.title}</p>
      {draft.body && (
        <p className='whitespace-pre-wrap leading-relaxed text-muted-foreground'>{draft.body}</p>
      )}
      {draft.labels.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {draft.labels.map((label) => (
            <span key={label} className='rounded-full border px-2 py-0.5'>
              {label}
            </span>
          ))}
        </div>
      )}
      {state === "done" && url ? (
        <a
          href={url}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1 font-medium text-brand hover:underline'
        >
          View issue on GitHub
          <ExternalLink className='size-3' />
        </a>
      ) : (
        <Button size='sm' onClick={create} disabled={state === "pending"} className='h-7 text-xs'>
          {state === "pending" && <Loader2 className='animate-spin' />}
          Create issue
        </Button>
      )}
    </div>
  );
}

type AnyResult = Record<string, unknown> & { success?: boolean; error?: string };

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function Row({ children, href }: { children: React.ReactNode; href?: string }) {
  const className =
    "flex items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent/60";
  return href ? (
    <a href={href} target='_blank' rel='noreferrer' className={className}>
      {children}
      <ExternalLink className='ml-auto size-3 shrink-0 text-muted-foreground' />
    </a>
  ) : (
    <div className={className}>{children}</div>
  );
}

function renderResult(name: string, result: AnyResult): React.ReactNode {
  if (result.success === false) {
    return <p className='px-3 py-2 text-xs text-destructive'>{result.error}</p>;
  }

  switch (name) {
    case "getCommits":
      return list<Commit>(result.commits).map((c) => (
        <Row key={c.sha}>
          <span className='font-mono text-muted-foreground'>{c.sha}</span>
          <span className='truncate'>{c.message}</span>
        </Row>
      ));
    case "getPullRequests":
      return list<PullRequest>(result.pullRequests).map((pr) => (
        <Row key={pr.number} href={pr.url}>
          <span className='font-mono text-muted-foreground'>#{pr.number}</span>
          <span className='truncate'>{pr.title}</span>
        </Row>
      ));
    case "getIssues":
      return list<Issue>(result.issues).map((issue) => (
        <Row key={issue.number} href={issue.url}>
          <span className='font-mono text-muted-foreground'>#{issue.number}</span>
          <span className='truncate'>{issue.title}</span>
        </Row>
      ));
    case "getBranches":
      return (
        <div className='flex flex-wrap gap-1.5 p-3'>
          {list<string>(result.branches).map((b) => (
            <span key={String(b)} className='rounded border bg-background px-1.5 py-0.5 font-mono text-[11px]'>
              {String(b)}
            </span>
          ))}
        </div>
      );
    case "getRepositories":
      return list<{ repo: string; lang: string | null }>(result.repos).map((r) => (
        <Row key={r.repo}>
          <span className='truncate'>{r.repo}</span>
          <span className='ml-auto font-mono text-muted-foreground'>{r.lang ?? ""}</span>
        </Row>
      ));
    case "getFileContent":
      if (result.type === "directory") {
        return list<DirectoryEntry>(result.items).map((item) => (
          <Row key={item.path}>
            {item.type === "dir" ? (
              <Folder className='size-3.5 shrink-0 text-muted-foreground' />
            ) : (
              <FileCode2 className='size-3.5 shrink-0 text-muted-foreground' />
            )}
            <span className='truncate font-mono'>{item.name}</span>
          </Row>
        ));
      }
      return (
        <Row href={(result.url as string | null) ?? undefined}>
          <FileCode2 className='size-3.5 shrink-0 text-muted-foreground' />
          <span className='truncate font-mono'>{result.path as string}</span>
          {Boolean(result.truncated) && (
            <span className='text-muted-foreground'>(truncated)</span>
          )}
        </Row>
      );
    case "draftIssue": {
      const draft = result.draft as IssueDraft | undefined;
      return draft ? <DraftIssue draft={draft} /> : null;
    }
    case "createIssue": {
      const issue = result.issue as
        | { number: number; title: string; url?: string }
        | undefined;
      if (!issue) return null;
      return (
        <Row href={issue.url}>
          <span className='font-mono text-muted-foreground'>#{issue.number}</span>
          <span className='truncate'>{issue.title}</span>
        </Row>
      );
    }
    case "reviewPullRequest": {
      const review = (result.review ?? {}) as Record<string, unknown>;
      const sections = [
        ["Potential issues", list<string>(review.issues)],
        ["Security", list<string>(review.security)],
        ["Suggestions", list<string>(review.suggestions)],
      ] as const;
      return (
        <div className='space-y-3 p-3 text-xs'>
          <p className='leading-relaxed'>{String(review.summary ?? "")}</p>
          {sections.map(([title, items]) =>
            items.length ? (
              <div key={title}>
                <p className='mb-1 font-medium'>{title}</p>
                <ul className='list-disc space-y-1 pl-4 text-muted-foreground'>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

export function ToolCallCard({ invocation }: { invocation: ToolInvocationView }) {
  const expandedByDefault = ["reviewPullRequest", "draftIssue"].includes(
    invocation.toolName,
  );
  const [open, setOpen] = useState(expandedByDefault);
  const done = invocation.state === "result";
  const result = (done ? invocation.result : undefined) as AnyResult | undefined;
  const failed = result?.success === false;
  const label = LABELS[invocation.toolName] ?? invocation.toolName;
  const rendered = result ? renderResult(invocation.toolName, result) : null;
  const body =
    Array.isArray(rendered) && rendered.length === 0 ? null : rendered;

  return (
    <div className='overflow-hidden rounded-lg border bg-muted/30'>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        disabled={!done || !body}
        className='flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground transition-colors enabled:hover:text-foreground'
      >
        {!done ? (
          <Loader2 className='size-3.5 animate-spin' />
        ) : failed ? (
          <CircleAlert className='size-3.5 text-destructive' />
        ) : (
          <Check className='size-3.5 text-success' />
        )}
        <span className='font-medium'>{label}</span>
        {done && body && (
          <ChevronRight
            className={cn("ml-auto size-3.5 transition-transform", open && "rotate-90")}
          />
        )}
      </button>
      {open && body && (
        <div className='max-h-72 overflow-y-auto border-t bg-background'>{body}</div>
      )}
    </div>
  );
}
