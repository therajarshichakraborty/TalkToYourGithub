"use client";

import { formatDistanceToNowStrict } from "date-fns";
import {
  Activity,
  CircleDot,
  GitBranch,
  GitFork,
  GitPullRequest,
  Lock,
  RefreshCw,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { GithubIcon } from "@/components/brand/github-icon";
import { ChatUI } from "@/components/chat/chat-ui";
import { StatTile } from "@/components/dashboard/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SyncButton } from "@/components/workspace/sync-button";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { githubUrl } from "@/lib/github/paths";
import {
  CommitsPanel,
  Panel,
  ReadmePanel,
  SummaryPanel,
  WorkItemsPanel,
} from "./panels";
import { useRepositoryDetails } from "./use-repository-details";

type Tab = "overview" | "assistant" | "activity";

export function RepositoryView({ owner, name }: { owner: string; name: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const { data, error, isLoading, reload } = useRepositoryDetails(owner, name);
  const cached = useWorkspace().findRepository(owner, name);
  const chatRepo = useMemo(() => ({ owner, name }), [owner, name]);
  const url = githubUrl(owner, name);

  const description = data?.repo.description ?? cached?.description;
  const language = data?.repo.language ?? cached?.language;
  const isPrivate = data?.repo.isPrivate ?? cached?.isPrivate;
  const defaultBranch = data?.repo.defaultBranch ?? cached?.defaultBranch;

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as Tab)}
      className='flex h-full flex-col gap-0'
    >
      <div className='border-b'>
        <div className='mx-auto w-full max-w-7xl px-4 pt-6 md:px-8'>
          <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
            <div className='min-w-0'>
              <h1 className='truncate text-2xl font-semibold tracking-tight'>
                <span className='text-muted-foreground'>{owner} / </span>
                {name}
              </h1>
              {description && (
                <p className='mt-1.5 max-w-2xl text-sm text-muted-foreground'>
                  {description}
                </p>
              )}
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                {isPrivate !== undefined && (
                  <Badge variant='outline' className='gap-1'>
                    {isPrivate && <Lock className='size-3' />}
                    {isPrivate ? "Private" : "Public"}
                  </Badge>
                )}
                {language && <Badge variant='secondary'>{language}</Badge>}
                {defaultBranch && (
                  <Badge variant='outline' className='gap-1 font-mono'>
                    <GitBranch className='size-3' />
                    {defaultBranch}
                  </Badge>
                )}
                {data?.repo.pushedAt && (
                  <span className='text-xs text-muted-foreground'>
                    Pushed{" "}
                    {formatDistanceToNowStrict(new Date(data.repo.pushedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={reload}
                disabled={isLoading}
                className='h-8 text-xs'
                aria-label='Refresh repository'
              >
                <RefreshCw className={isLoading ? "animate-spin" : undefined} />
              </Button>
              <SyncButton owner={owner} name={name} />
              <Button asChild size='sm' className='shadow-button h-8 gap-1.5 text-xs'>
                <a href={url} target='_blank' rel='noreferrer'>
                  <GithubIcon className='size-3.5' />
                  Open
                </a>
              </Button>
            </div>
          </div>

          <TabsList variant='line' className='mt-5 h-10'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='assistant'>Assistant</TabsTrigger>
            <TabsTrigger value='activity'>Activity</TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent value='overview' className='min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8'>
          {error && !data ? (
            <div className='rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm'>
              <p className='font-medium text-destructive'>Could not load this repository.</p>
              <p className='mt-1 text-muted-foreground'>{error}</p>
              <Button variant='outline' size='sm' onClick={reload} className='mt-4'>
                Try again
              </Button>
            </div>
          ) : (
            <>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5'>
                <StatTile label='Stars' icon={Star} value={String(data?.stats.stars ?? 0)} isLoading={!data} />
                <StatTile label='Forks' icon={GitFork} value={String(data?.stats.forks ?? 0)} isLoading={!data} />
                <StatTile label='Branches' icon={GitBranch} value={String(data?.stats.branches ?? 0)} isLoading={!data} />
                <StatTile label='Open PRs' icon={GitPullRequest} value={String(data?.stats.openPullRequests ?? 0)} isLoading={!data} />
                <StatTile label='Open issues' icon={CircleDot} value={String(data?.stats.openIssues ?? 0)} isLoading={!data} />
              </div>

              {!data ? (
                <div className='grid gap-6 lg:grid-cols-2'>
                  <Skeleton className='h-64 rounded-xl' />
                  <Skeleton className='h-64 rounded-xl' />
                </div>
              ) : (
                <div className='grid gap-6 lg:grid-cols-[1.3fr_1fr]'>
                  <div className='min-w-0 space-y-6'>
                    <SummaryPanel summary={data.summary} generatedAt={data.summaryGeneratedAt} />
                    {data.readme && <ReadmePanel readme={data.readme} url={url} />}
                  </div>
                  <div className='min-w-0 space-y-6'>
                    <CommitsPanel commits={data.commits} url={url} />
                    <WorkItemsPanel
                      title='Open pull requests'
                      items={data.pullRequests}
                      emptyLabel='No open pull requests.'
                      kind='pr'
                      href={`${url}/pulls`}
                    />
                    <WorkItemsPanel
                      title='Open issues'
                      items={data.issues}
                      emptyLabel='No open issues.'
                      kind='issue'
                      href={`${url}/issues`}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent
        value='assistant'
        forceMount
        className='min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden'
      >
        <ChatUI repo={chatRepo} />
      </TabsContent>

      <TabsContent value='activity' className='min-h-0 flex-1 overflow-y-auto'>
        <div className='mx-auto w-full max-w-3xl p-4 md:p-8'>
          <Panel title='Activity' description='Commits, pull requests, issues and conversations'>
            {!data ? (
              <div className='space-y-3 p-5'>
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className='h-10 w-full' />
                ))}
              </div>
            ) : data.activity.length === 0 ? (
              <div className='flex flex-col items-center gap-2 px-5 py-12 text-center'>
                <Activity className='size-5 text-muted-foreground' />
                <p className='text-sm text-muted-foreground'>
                  No activity recorded yet. Run a sync or ask the assistant a question.
                </p>
              </div>
            ) : (
              <ol className='relative space-y-5 px-5 py-5 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-border'>
                {data.activity.map((item) => (
                  <li key={item.id} className='relative flex gap-4'>
                    <span className='relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-card bg-muted-foreground ring-4 ring-card' />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-baseline justify-between gap-3'>
                        <p className='truncate text-sm font-medium'>
                          {item.title ?? "Activity"}
                        </p>
                        <span className='shrink-0 text-xs text-muted-foreground'>
                          {formatDistanceToNowStrict(new Date(item.occurredAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className='mt-0.5 text-xs text-muted-foreground'>
                        <span className='font-mono uppercase'>{item.type}</span>
                        {item.description && item.description !== item.title
                          ? ` · ${item.description}`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </TabsContent>
    </Tabs>
  );
}
