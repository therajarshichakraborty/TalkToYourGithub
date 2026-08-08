/*
 * Page: /repositories/[owner]/[name]
 * Description: Dedicated repository view page for Day 17 of TalkToYourGithub.
 * Displays AI summary, repository stats, recent commits, activity logs, and integrated chat.
 */

"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { RepositoryItem } from "@/components/sidebar/repo-list";
import { ChatUI } from "@/components/chat/chat-ui";
import { SummaryDisplay } from "@/components/dashboard/summary-display";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  FolderGit2,
  ArrowLeft,
  Sparkles,
  GitCommit,
  GitBranch,
  GitPullRequest,
  AlertCircle,
  MessageSquare,
  FileText,
  Clock,
  Activity,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

interface RepoDetailsData {
  owner: string;
  name: string;
  fullName: string;
  summary: string | null;
  summaryGeneratedAt: string | null;
  activityLogs: Array<{
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    occurredAt: string;
  }>;
  stats: {
    commitsCount: number;
    branchesCount: number;
    pullRequestsCount: number;
    issuesCount: number;
  };
  commits: Array<{
    message: string;
    author: string;
    date: string;
    sha: string;
  }>;
  branches: string[];
  readmeSnippet: string | null;
}

export default function RepositoryDetailPage(props: {
  params: Promise<{ owner: string; name: string }>;
}) {
  /* Unwrap async route parameters in Next.js App Router */
  const resolvedParams = React.use(props.params);
  const { owner, name } = resolvedParams;

  /* State storage */
  const [data, setData] = useState<RepoDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<RepositoryItem | null>({
    id: `${owner}/${name}`,
    owner,
    name,
    fullName: `${owner}/${name}`,
    description: "",
    defaultBranch: "main",
    language: "Unknown",
    isPrivate: false,
    stars: 0,
  });

  const { data: session } = authClient.useSession();

  /* Fetch repository details from /api/repositories/[owner]/[name] */
  const fetchRepoDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
      );
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed to load repository details.");
      }

      setData(resData);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Error loading repository details.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepoDetails();
  }, [owner, name]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className='flex h-screen w-screen overflow-hidden bg-background text-foreground'>
        {/* Navigation Sidebar */}
        <AppSidebar
          selectedRepo={selectedRepo}
          onSelectRepo={setSelectedRepo}
          user={session?.user}
        />

        {/* Main Workspace Area */}
        <SidebarInset className='flex flex-col flex-1 h-full min-w-0 overflow-hidden'>
          {/* Top Header Bar with Breadcrumb and Nav */}
          <header className='flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/95 backdrop-blur'>
            <div className='flex items-center gap-2'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='mr-1 h-4' />

              <Link href='/dashboard'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 text-xs gap-1 text-muted-foreground hover:text-foreground'
                >
                  <ArrowLeft className='h-3.5 w-3.5' />
                  Dashboard
                </Button>
              </Link>

              <Separator orientation='vertical' className='h-4' />

              <div className='flex items-center gap-1.5 text-xs font-semibold'>
                <FolderGit2 className='h-4 w-4 text-primary' />
                <span className='text-muted-foreground'>{owner}</span>
                <span className='text-muted-foreground'>/</span>
                <span className='text-foreground'>{name}</span>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={fetchRepoDetails}
                className='h-7 text-xs'
                title='Refresh repository data'
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>

              <AnimatedThemeToggler
                variant='circle'
                className='flex h-7 w-7 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40'
              />
            </div>
          </header>

          {/* Repository Main Content Tabs */}
          <main className='flex-1 h-[calc(100vh-3rem)] overflow-hidden'>
            <Tabs defaultValue='overview' className='h-full flex flex-col'>
              <div className='px-4 border-b bg-muted/20 shrink-0'>
                <TabsList className='h-9 p-0 bg-transparent gap-4'>
                  <TabsTrigger
                    value='overview'
                    className='text-xs h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent'
                  >
                    Overview & AI Summary
                  </TabsTrigger>
                  <TabsTrigger
                    value='chat'
                    className='text-xs h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5'
                  >
                    <MessageSquare className='h-3.5 w-3.5 text-primary' />
                    Repository Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value='activity'
                    className='text-xs h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent'
                  >
                    Activity Log
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab 1: Repository Overview & AI Summary */}
              <TabsContent
                value='overview'
                className='flex-1 overflow-y-auto p-4 space-y-4 m-0'
              >
                {isLoading && (
                  <div className='space-y-4 max-w-4xl mx-auto'>
                    <Skeleton className='h-8 w-64' />
                    <Skeleton className='h-32 w-full' />
                    <div className='grid grid-cols-4 gap-3'>
                      <Skeleton className='h-20' />
                      <Skeleton className='h-20' />
                      <Skeleton className='h-20' />
                      <Skeleton className='h-20' />
                    </div>
                  </div>
                )}

                {error && (
                  <div className='p-8 text-center text-destructive text-sm space-y-2'>
                    <p>{error}</p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={fetchRepoDetails}
                    >
                      Retry loading
                    </Button>
                  </div>
                )}

                {!isLoading && data && (
                  <div className='max-w-4xl mx-auto space-y-4'>
                    {/* Repository Header Information */}
                    <div className='flex items-center justify-between'>
                      <div>
                        <h1 className='text-xl font-bold tracking-tight'>
                          {data.fullName}
                        </h1>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          Sampled branches: {data.branches.join(", ") || "main"}
                        </p>
                      </div>
                      <Badge variant='secondary' className='gap-1 text-xs'>
                        <Clock className='h-3 w-3' />
                        {data.summaryGeneratedAt
                          ? `Summary updated ${formatDistanceToNow(new Date(data.summaryGeneratedAt), { addSuffix: true })}`
                          : "Live sync active"}
                      </Badge>
                    </div>

                    {/* Repository Quick Stats Grid */}
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3.5'>
                      <Card className='p-4 border border-border/80 bg-card rounded-2xl shadow-xs flex items-center gap-3.5 hover:border-primary/40 transition-all'>
                        <div className='p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0'>
                          <GitCommit className='h-5 w-5' />
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground font-medium'>
                            Commits
                          </div>
                          <div className='text-lg font-extrabold tracking-tight'>
                            {data.stats.commitsCount}
                          </div>
                        </div>
                      </Card>

                      <Card className='p-4 border border-border/80 bg-card rounded-2xl shadow-xs flex items-center gap-3.5 hover:border-primary/40 transition-all'>
                        <div className='p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0'>
                          <GitBranch className='h-5 w-5' />
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground font-medium'>
                            Branches
                          </div>
                          <div className='text-lg font-extrabold tracking-tight'>
                            {data.stats.branchesCount}
                          </div>
                        </div>
                      </Card>

                      <Card className='p-4 border border-border/80 bg-card rounded-2xl shadow-xs flex items-center gap-3.5 hover:border-primary/40 transition-all'>
                        <div className='p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0'>
                          <GitPullRequest className='h-5 w-5' />
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground font-medium'>
                            Pull Requests
                          </div>
                          <div className='text-lg font-extrabold tracking-tight'>
                            {data.stats.pullRequestsCount}
                          </div>
                        </div>
                      </Card>

                      <Card className='p-4 border border-border/80 bg-card rounded-2xl shadow-xs flex items-center gap-3.5 hover:border-primary/40 transition-all'>
                        <div className='p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0'>
                          <AlertCircle className='h-5 w-5' />
                        </div>
                        <div>
                          <div className='text-xs text-muted-foreground font-medium'>
                            Issues
                          </div>
                          <div className='text-lg font-extrabold tracking-tight'>
                            {data.stats.issuesCount}
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* AI Generated Repository Summary */}
                    <SummaryDisplay
                      owner={owner}
                      repo={name}
                      summary={data.summary}
                      generatedAt={data.summaryGeneratedAt}
                    />

                    {/* Recent Commits */}
                    {data.commits.length > 0 && (
                      <Card className='border border-border/80 bg-card rounded-2xl shadow-xs overflow-hidden'>
                        <CardHeader className='p-4 pb-2 border-b bg-muted/20'>
                          <CardTitle className='text-sm font-bold tracking-tight flex items-center gap-2'>
                            <GitCommit className='h-4 w-4 text-primary' />
                            Recent Commits
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-4 pt-3 space-y-2'>
                          {data.commits.map((c, i) => (
                            <div
                              key={i}
                              className='flex items-center justify-between text-xs p-3 rounded-xl bg-muted/20 border border-muted/50 transition-colors hover:bg-muted/40'
                            >
                              <div className='truncate pr-2'>
                                <span className='font-semibold text-foreground'>
                                  {c.message}
                                </span>
                                <span className='text-[11px] text-muted-foreground ml-2'>
                                  by {c.author}
                                </span>
                              </div>
                              {c.sha && (
                                <Badge
                                  variant='outline'
                                  className='font-mono text-[10px] shrink-0 rounded-full px-2.5'
                                >
                                  {c.sha}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* README Preview */}
                    {data.readmeSnippet && (
                      <Card className='border border-border/80 bg-card rounded-2xl shadow-xs overflow-hidden'>
                        <CardHeader className='p-4 pb-2 border-b bg-muted/20'>
                          <CardTitle className='text-sm font-bold tracking-tight flex items-center gap-2'>
                            <FileText className='h-4 w-4 text-primary' />
                            README.md Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className='p-4 pt-3'>
                          <div className='p-4 bg-muted/30 border border-muted/50 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-60 leading-relaxed text-muted-foreground'>
                            {data.readmeSnippet}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Embedded AI Chat */}
              <TabsContent
                value='chat'
                className='flex-1 h-full m-0 p-0 overflow-hidden'
              >
                <ChatUI activeRepo={selectedRepo} />
              </TabsContent>

              {/* Tab 3: Activity Log */}
              <TabsContent
                value='activity'
                className='flex-1 overflow-y-auto p-4 space-y-4 m-0'
              >
                <div className='max-w-4xl mx-auto space-y-3'>
                  <h3 className='text-sm font-bold tracking-tight flex items-center gap-2'>
                    <Activity className='h-4 w-4 text-primary' />
                    Activity Log Timeline
                  </h3>

                  {data?.activityLogs && data.activityLogs.length > 0 ? (
                    <div className='relative pl-6 space-y-4 pt-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60'>
                      {data.activityLogs.map((log) => {
                        const typeStr = (log.type || "event").toLowerCase();
                        let icon = (
                          <Activity className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                        );
                        let badgeBg =
                          "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/40";
                        let typeLabel = (log.type || "EVENT").toUpperCase();

                        if (typeStr.includes("chat")) {
                          icon = (
                            <MessageSquare className='h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400' />
                          );
                          badgeBg =
                            "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/40";
                          typeLabel = "CHAT";
                        } else if (typeStr.includes("commit")) {
                          icon = (
                            <GitCommit className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' />
                          );
                          badgeBg =
                            "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40";
                          typeLabel = "COMMIT";
                        } else if (
                          typeStr.includes("pr") ||
                          typeStr.includes("pull")
                        ) {
                          icon = (
                            <GitPullRequest className='h-3.5 w-3.5 text-violet-600 dark:text-violet-400' />
                          );
                          badgeBg =
                            "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900/40";
                          typeLabel = "PR";
                        } else if (typeStr.includes("summary")) {
                          icon = (
                            <Sparkles className='h-3.5 w-3.5 text-amber-600 dark:text-amber-400' />
                          );
                          badgeBg =
                            "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40";
                          typeLabel = "SUMMARY";
                        }

                        const formattedTime = formatDistanceToNow(
                          new Date(log.occurredAt),
                          { addSuffix: true },
                        );

                        return (
                          <div
                            key={log.id}
                            className='relative flex items-start gap-4 group'
                          >
                            {/* Icon Node */}
                            <div className='absolute -left-6 top-1 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-xs shrink-0 z-10'>
                              {icon}
                            </div>

                            {/* Activity Card */}
                            <Card className='flex-1 border border-border/80 bg-card p-4 rounded-2xl shadow-xs hover:border-indigo-500/30 transition-all space-y-2'>
                              <div className='flex items-center justify-between gap-3'>
                                <div className='flex items-center gap-2 min-w-0 flex-1'>
                                  <Badge
                                    variant='outline'
                                    className={`text-[10px] font-mono font-bold rounded-full px-2.5 py-0.5 ${badgeBg}`}
                                  >
                                    {typeLabel}
                                  </Badge>
                                  <h4 className='text-xs font-bold text-foreground truncate'>
                                    {log.title ||
                                      log.description ||
                                      "Activity Logged"}
                                  </h4>
                                </div>
                                <span className='text-[10px] text-muted-foreground font-mono shrink-0 bg-muted/40 px-2.5 py-1 rounded-full border border-muted/50 flex items-center gap-1'>
                                  <Clock className='h-3 w-3 text-muted-foreground' />
                                  {formattedTime}
                                </span>
                              </div>

                              {log.description &&
                                log.title &&
                                log.description !== log.title && (
                                  <p className='text-xs text-muted-foreground leading-relaxed font-normal bg-muted/20 p-3 rounded-xl border border-muted/40 break-words'>
                                    {log.description}
                                  </p>
                                )}
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className='p-12 text-center text-xs text-muted-foreground border-dashed rounded-2xl'>
                      No activity logged for this repository yet.
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
