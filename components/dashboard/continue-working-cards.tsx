/*
 * Component: ContinueWorkingCards
 * Description: Renders Continue Working dashboard cards populated from activity_logs and repository_summaries.
 * Helps developers quickly re-orient themselves on active repositories after time away.
 */

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RepositoryItem } from "@/components/sidebar/repo-list";
import {
  FolderGit2,
  Clock,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Activity,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ContinueWorkingRepo {
  owner: string;
  name: string;
  fullName: string;
  activities: Array<{
    id: string;
    type: string;
    title: string | null;
    description: string | null;
    occurredAt: string;
  }>;
  latestActivityAt: string;
  summary: string | null;
}

interface ContinueWorkingCardsProps {
  onSelectRepoForChat: (repo: RepositoryItem) => void;
}

export function ContinueWorkingCards({
  onSelectRepoForChat,
}: ContinueWorkingCardsProps) {
  /* Dashboard repositories and state */
  const [repositories, setRepositories] = useState<ContinueWorkingRepo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * Fetch dashboard continue working data from /api/dashboard/continue-working
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/continue-working");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load Continue Working data.");
      }

      setRepositories(data.repositories || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error loading dashboard.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* Helper to render icon based on activity type */
  const renderActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "commit":
      case "push":
        return <GitCommit className='h-3.5 w-3.5 text-blue-500 shrink-0' />;
      case "pull_request":
      case "pr":
        return (
          <GitPullRequest className='h-3.5 w-3.5 text-purple-500 shrink-0' />
        );
      case "issue":
        return <AlertCircle className='h-3.5 w-3.5 text-amber-500 shrink-0' />;
      default:
        return <Activity className='h-3.5 w-3.5 text-emerald-500 shrink-0' />;
    }
  };

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='p-4 space-y-3'>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-8 w-full mt-2' />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8 text-center space-y-3'>
        <p className='text-sm text-destructive font-medium'>{error}</p>
        <Button variant='outline' size='sm' onClick={fetchDashboardData}>
          <RefreshCw className='h-3.5 w-3.5 mr-1.5' />
          Retry
        </Button>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <Card className='m-4 p-8 text-center space-y-4 border-dashed'>
        <div className='mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
          <FolderGit2 className='h-6 w-6' />
        </div>
        <div className='space-y-1'>
          <h3 className='font-semibold text-base'>
            No Recent Activity Logs Yet
          </h3>
          <p className='text-sm text-muted-foreground max-w-md mx-auto'>
            Connect your GitHub repositories or trigger webhook events to
            populate your Continue Working cards and AI summaries.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold tracking-tight flex items-center gap-2'>
            Continue Working
            <Badge variant='secondary' className='text-xs font-normal'>
              {repositories.length} Active Repos
            </Badge>
          </h2>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Pick up right where you left off across your GitHub projects.
          </p>
        </div>

        <Button
          variant='ghost'
          size='sm'
          onClick={fetchDashboardData}
          className='h-8 text-xs'
        >
          <RefreshCw className='h-3.5 w-3.5 mr-1.5' />
          Refresh
        </Button>
      </div>

      {/* Grid of Continue Working Repository Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {repositories.map((repo) => {
          const formattedTime = repo.latestActivityAt
            ? formatDistanceToNow(new Date(repo.latestActivityAt), {
                addSuffix: true,
              })
            : "Recently";

          return (
            <Card
              key={repo.fullName}
              className='flex flex-col justify-between hover:border-primary/50 transition-colors shadow-xs'
            >
              <CardHeader className='p-4 pb-2'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <div className='p-1.5 rounded bg-primary/10 text-primary shrink-0'>
                      <FolderGit2 className='h-4 w-4' />
                    </div>
                    <div className='truncate'>
                      <CardTitle className='text-sm font-semibold truncate'>
                        {repo.name}
                      </CardTitle>
                      <CardDescription className='text-[11px] truncate'>
                        {repo.owner}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant='outline'
                    className='text-[10px] gap-1 shrink-0 font-normal'
                  >
                    <Clock className='h-2.5 w-2.5 text-muted-foreground' />
                    {formattedTime}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className='p-4 pt-2 space-y-3 flex-1'>
                {/* AI Summary Preview if present */}
                {repo.summary ? (
                  <div className='bg-muted/40 p-2.5 rounded-lg border text-xs space-y-1'>
                    <div className='flex items-center gap-1 font-semibold text-primary text-[11px]'>
                      <Sparkles className='h-3 w-3 text-amber-500' />
                      AI Project Summary
                    </div>
                    <p className='line-clamp-3 text-muted-foreground leading-relaxed text-[11px]'>
                      {repo.summary}
                    </p>
                  </div>
                ) : (
                  <div className='bg-muted/20 p-2.5 rounded-lg border text-xs text-muted-foreground flex items-center gap-2'>
                    <FileText className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                    <span className='text-[11px]'>
                      No AI summary generated yet for this repository.
                    </span>
                  </div>
                )}

                {/* Recent Activity Log Snippets */}
                {repo.activities.length > 0 && (
                  <div className='space-y-1.5 pt-1'>
                    <div className='text-[11px] font-medium text-muted-foreground'>
                      Recent Activity ({repo.activities.length})
                    </div>
                    <div className='space-y-1'>
                      {repo.activities.slice(0, 2).map((act) => (
                        <div
                          key={act.id}
                          className='flex items-center gap-2 text-[11px] py-1 px-2 rounded bg-background border truncate'
                        >
                          {renderActivityIcon(act.type)}
                          <span className='truncate font-medium flex-1'>
                            {act.title || act.description || "Activity logged"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className='p-4 pt-2 border-t flex items-center justify-between gap-2 bg-muted/10'>
                <Link
                  href={`/repositories/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`}
                  className='flex-1'
                >
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full text-xs h-8 justify-between'
                  >
                    <span>View Details</span>
                    <ArrowRight className='h-3 w-3' />
                  </Button>
                </Link>

                <Button
                  variant='default'
                  size='sm'
                  onClick={() =>
                    onSelectRepoForChat({
                      id: `${repo.owner}/${repo.name}`,
                      owner: repo.owner,
                      name: repo.name,
                      fullName: repo.fullName,
                      description: "",
                      defaultBranch: "main",
                      language: "Unknown",
                      isPrivate: false,
                      stars: 0,
                    })
                  }
                  className='text-xs h-8 gap-1.5'
                >
                  <MessageSquare className='h-3.5 w-3.5' />
                  <span>Chat</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
