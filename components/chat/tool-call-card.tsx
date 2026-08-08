/*
 * Component: ToolCallCard
 * Description: Rich visual component for rendering AI tool execution results in the chat UI.
 * Handles specific card layouts for PR reviews, commit lists, branch lists, issues, and file content.
 */

"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  CheckCircle2,
  AlertCircle,
  GitCommit,
  GitBranch,
  GitPullRequest,
  FileCode,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ThumbsUp,
  Lightbulb,
  ExternalLink,
  Folder,
} from "lucide-react";

interface ToolCallCardProps {
  toolName: string;
  args: any;
  result?: any;
  state: "call" | "result";
}

export function ToolCallCard({
  toolName,
  args,
  result,
  state,
}: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (state !== "result" || !result) {
    return (
      <div className='flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border text-xs font-mono'>
        <Wrench className='h-3.5 w-3.5 text-primary animate-spin' />
        <span className='font-semibold'>{toolName}</span>
        <span className='text-muted-foreground truncate max-w-[200px]'>
          {JSON.stringify(args || {})}
        </span>
      </div>
    );
  }

  /*
   * Handler for reviewPullRequest tool
   */
  if (toolName === "reviewPullRequest" && result.success && result.review) {
    const rev = result.review;
    return (
      <Card className='my-2 border-primary/30 bg-muted/20 text-xs shadow-xs'>
        <CardHeader className='p-3 pb-2 flex flex-row items-center justify-between border-b bg-muted/40'>
          <div className='flex items-center gap-2'>
            <Sparkles className='h-4 w-4 text-purple-500' />
            <CardTitle className='text-xs font-semibold'>
              PR Review: {result.owner}/{result.repo} #{result.pullNumber}
            </CardTitle>
            <Badge variant='outline' className='text-[10px]'>
              {result.title}
            </Badge>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className='h-3.5 w-3.5' />
            ) : (
              <ChevronDown className='h-3.5 w-3.5' />
            )}
          </Button>
        </CardHeader>

        {isExpanded && (
          <CardContent className='p-3 space-y-3'>
            {/* PR Summary */}
            <div className='space-y-1'>
              <span className='font-medium text-foreground text-[11px]'>
                Overview
              </span>
              <p className='text-muted-foreground leading-relaxed'>
                {rev.summary}
              </p>
            </div>

            {/* Positives */}
            {rev.positives?.length > 0 && (
              <div className='space-y-1 p-2 rounded bg-emerald-500/10 border border-emerald-500/20'>
                <span className='font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-[11px]'>
                  <ThumbsUp className='h-3 w-3' />
                  Positives ({rev.positives.length})
                </span>
                <ul className='list-disc list-inside space-y-0.5 text-muted-foreground'>
                  {rev.positives.map((p: string, idx: number) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Potential Issues */}
            {rev.potentialIssues?.length > 0 && (
              <div className='space-y-1 p-2 rounded bg-amber-500/10 border border-amber-500/20'>
                <span className='font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-[11px]'>
                  <AlertCircle className='h-3 w-3' />
                  Potential Bugs / Risks ({rev.potentialIssues.length})
                </span>
                <ul className='list-disc list-inside space-y-0.5 text-muted-foreground'>
                  {rev.potentialIssues.map((pi: string, idx: number) => (
                    <li key={idx}>{pi}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Security Flags */}
            {rev.securityFlags?.length > 0 && (
              <div className='space-y-1 p-2 rounded bg-destructive/10 border border-destructive/20'>
                <span className='font-semibold text-destructive flex items-center gap-1.5 text-[11px]'>
                  <ShieldAlert className='h-3 w-3' />
                  Security Flags ({rev.securityFlags.length})
                </span>
                <ul className='list-disc list-inside space-y-0.5 text-destructive/90'>
                  {rev.securityFlags.map((sf: string, idx: number) => (
                    <li key={idx}>{sf}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {rev.suggestions?.length > 0 && (
              <div className='space-y-1 p-2 rounded bg-blue-500/10 border border-blue-500/20'>
                <span className='font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-[11px]'>
                  <Lightbulb className='h-3 w-3' />
                  Actionable Suggestions ({rev.suggestions.length})
                </span>
                <ul className='list-disc list-inside space-y-0.5 text-muted-foreground'>
                  {rev.suggestions.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  }

  /*
   * Handler for getCommits tool
   */
  if (
    toolName === "getCommits" &&
    result.success &&
    Array.isArray(result.commits)
  ) {
    return (
      <Card className='my-2 border-border bg-muted/20 text-xs shadow-xs'>
        <CardHeader className='p-2.5 px-3 flex flex-row items-center justify-between border-b bg-muted/40'>
          <div className='flex items-center gap-2'>
            <GitCommit className='h-4 w-4 text-blue-500' />
            <span className='font-semibold'>
              Commits ({result.commits.length})
            </span>
            <span className='text-muted-foreground text-[11px]'>
              {args.owner}/{args.repo}
            </span>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='h-6 w-6 p-0'
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className='h-3.5 w-3.5' />
            ) : (
              <ChevronDown className='h-3.5 w-3.5' />
            )}
          </Button>
        </CardHeader>
        {isExpanded && (
          <CardContent className='p-2.5 space-y-1.5'>
            {result.commits.slice(0, 5).map((c: any, i: number) => (
              <div
                key={i}
                className='flex items-center justify-between gap-2 p-1.5 rounded bg-background border text-[11px]'
              >
                <div className='truncate flex-1'>
                  <span className='font-medium'>
                    {c.commit?.message || c.message || "Commit"}
                  </span>
                  <span className='text-muted-foreground ml-2 text-[10px]'>
                    by {c.commit?.author?.name || c.author || "Unknown"}
                  </span>
                </div>
                {c.sha && (
                  <Badge
                    variant='outline'
                    className='font-mono text-[9px] shrink-0'
                  >
                    {String(c.sha).slice(0, 7)}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    );
  }

  /*
   * Handler for getBranches tool
   */
  if (
    toolName === "getBranches" &&
    result.success &&
    Array.isArray(result.branches)
  ) {
    return (
      <Card className='my-2 border-border bg-muted/20 text-xs shadow-xs'>
        <CardHeader className='p-2.5 px-3 flex flex-row items-center justify-between border-b bg-muted/40'>
          <div className='flex items-center gap-2'>
            <GitBranch className='h-4 w-4 text-emerald-500' />
            <span className='font-semibold'>
              Branches ({result.branches.length})
            </span>
            <span className='text-muted-foreground text-[11px]'>
              {args.owner}/{args.repo}
            </span>
          </div>
        </CardHeader>
        <CardContent className='p-2.5 flex flex-wrap gap-1.5'>
          {result.branches.map((b: any, idx: number) => {
            const name = typeof b === "string" ? b : b?.name || "";
            if (!name) return null;
            return (
              <Badge
                key={idx}
                variant='secondary'
                className='font-mono text-[11px] gap-1'
              >
                <GitBranch className='h-3 w-3 text-muted-foreground' />
                {name}
              </Badge>
            );
          })}
        </CardContent>
      </Card>
    );
  }

  /*
   * Handler for getPullRequests tool
   */
  if (
    toolName === "getPullRequests" &&
    result.success &&
    Array.isArray(result.pullRequests)
  ) {
    return (
      <Card className='my-2 border-border bg-muted/20 text-xs shadow-xs'>
        <CardHeader className='p-2.5 px-3 flex flex-row items-center justify-between border-b bg-muted/40'>
          <div className='flex items-center gap-2'>
            <GitPullRequest className='h-4 w-4 text-purple-500' />
            <span className='font-semibold'>
              Pull Requests ({result.pullRequests.length})
            </span>
          </div>
        </CardHeader>
        <CardContent className='p-2.5 space-y-1.5'>
          {result.pullRequests.slice(0, 5).map((pr: any, i: number) => (
            <div
              key={i}
              className='flex items-center justify-between gap-2 p-1.5 rounded bg-background border text-[11px]'
            >
              <span className='font-medium truncate flex-1'>
                #{pr.number || pr.id} {pr.title || "Pull Request"}
              </span>
              <Badge
                variant={pr.state === "open" ? "default" : "secondary"}
                className='text-[10px]'
              >
                {pr.state || "open"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  /*
   * Handler for getFileContent tool (Directory listing & file content)
   */
  if (toolName === "getFileContent" && result.success) {
    if (result.type === "directory" && Array.isArray(result.items)) {
      return (
        <Card className='my-2 border-border bg-muted/20 text-xs shadow-xs overflow-hidden rounded-2xl'>
          <CardHeader className='p-3 flex flex-row items-center justify-between border-b bg-muted/40'>
            <div className='flex items-center gap-2'>
              <Folder className='h-4 w-4 text-indigo-500' />
              <span className='font-bold text-foreground'>
                Directory: /{result.path || ""}
              </span>
              <Badge variant='outline' className='text-[10px] rounded-full font-mono'>
                {result.itemCount} items
              </Badge>
            </div>
            <Button
              variant='ghost'
              size='sm'
              className='h-6 w-6 p-0'
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className='h-3.5 w-3.5' />
              ) : (
                <ChevronDown className='h-3.5 w-3.5' />
              )}
            </Button>
          </CardHeader>
          {isExpanded && (
            <CardContent className='p-3 space-y-1.5'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono'>
                {result.items.map((item: any, idx: number) => {
                  const isDir = item.type === "dir" || item.type === "directory";
                  return (
                    <div
                      key={idx}
                      className='flex items-center gap-2 p-2 rounded-xl bg-background border border-border/60 hover:border-indigo-500/40 transition-colors'
                    >
                      {isDir ? (
                        <Folder className='h-3.5 w-3.5 text-indigo-500 shrink-0' />
                      ) : (
                        <FileCode className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                      )}
                      <span className='truncate font-medium text-foreground text-[11px] flex-1'>
                        {item.name}
                      </span>
                      <Badge
                        variant='secondary'
                        className='text-[9px] uppercase px-1.5 py-0 font-sans'
                      >
                        {isDir ? "dir" : "file"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      );
    }
  }

  /*
   * Generic tool execution output fallback card
   */
  return (
    <div className='my-1.5 p-2 rounded bg-muted/40 border text-xs font-mono space-y-1'>
      <div className='flex items-center justify-between text-[11px]'>
        <div className='flex items-center gap-1.5 font-semibold text-foreground'>
          <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
          <span>{toolName}</span>
        </div>
        <span className='text-muted-foreground text-[10px]'>Executed</span>
      </div>
      <div className='text-muted-foreground text-[11px] truncate'>
        Result count:{" "}
        {Array.isArray(
          result.repositories ||
            result.commits ||
            result.branches ||
            result.issues,
        )
          ? (
              result.repositories ||
              result.commits ||
              result.branches ||
              result.issues
            ).length
          : "1 item"}
      </div>
    </div>
  );
}
