/*
 * Component: SummaryDisplay
 * Description: Formatted component for displaying AI-generated 3-paragraph repository summaries
 * with copy functionality, tech stack tags, and metadata callouts.
 */

"use client";

import React, { useState } from "react";
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
import { Sparkles, Copy, Check, FileText, Clock, Code2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SummaryDisplayProps {
  owner: string;
  repo: string;
  summary: string | null;
  generatedAt?: string | null;
  language?: string;
  defaultBranch?: string;
}

export function SummaryDisplay({
  owner,
  repo,
  summary,
  generatedAt,
  language,
  defaultBranch,
}: SummaryDisplayProps) {
  const [copied, setCopied] = useState<boolean>(false);

  /* Copy summary to clipboard handler */
  const handleCopy = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy summary:", err);
    }
  };

  /* Split summary text into paragraphs for structured display */
  const paragraphs = summary
    ? summary.split("\n\n").filter((p) => p.trim().length > 0)
    : [];

  return (
    <Card className='border border-border/80 bg-card shadow-xs rounded-2xl overflow-hidden'>
      <CardHeader className='p-4 pb-3 border-b bg-muted/30 flex flex-row items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='p-2 rounded-xl bg-primary/10 text-primary shrink-0'>
            <Sparkles className='h-4 w-4' />
          </div>
          <div>
            <CardTitle className='text-sm font-bold tracking-tight flex items-center gap-2'>
              <span>Repository AI Summary</span>
              <Badge variant='outline' className='text-[10px] font-mono font-normal'>
                {owner}/{repo}
              </Badge>
            </CardTitle>
            {generatedAt && (
              <CardDescription className='text-[11px] flex items-center gap-1 mt-0.5'>
                <Clock className='h-3 w-3' />
                Updated{" "}
                {formatDistanceToNow(new Date(generatedAt), {
                  addSuffix: true,
                })}
              </CardDescription>
            )}
          </div>
        </div>

        {summary && (
          <Button
            variant='outline'
            size='sm'
            onClick={handleCopy}
            className='h-8 text-xs gap-1.5 rounded-full border-border/80 font-semibold'
          >
            {copied ? (
              <>
                <Check className='h-3.5 w-3.5 text-emerald-500' />
                Copied
              </>
            ) : (
              <>
                <Copy className='h-3.5 w-3.5' />
                Copy Summary
              </>
            )}
          </Button>
        )}
      </CardHeader>

      <CardContent className='p-4 space-y-3.5'>
        {/* Language & Branch Badges */}
        {(language || defaultBranch) && (
          <div className='flex items-center gap-2 text-xs'>
            {language && (
              <Badge variant='secondary' className='gap-1.5 text-[11px] rounded-full px-3'>
                <Code2 className='h-3 w-3 text-primary' />
                {language}
              </Badge>
            )}
            {defaultBranch && (
              <Badge variant='outline' className='text-[11px] rounded-full px-3'>
                Branch: {defaultBranch}
              </Badge>
            )}
          </div>
        )}

        {/* Paragraphs Display */}
        {paragraphs.length > 0 ? (
          <div className='space-y-3 text-xs leading-relaxed text-foreground'>
            {paragraphs.map((para, idx) => (
              <div
                key={idx}
                className='p-3.5 rounded-xl bg-muted/20 border border-muted/60 space-y-1'
              >
                <div className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
                  {idx === 0
                    ? "1. Purpose & Core Value"
                    : idx === 1
                      ? "2. Architecture & Tech Stack"
                      : "3. Vitality & Activity Status"}
                </div>
                <p className='whitespace-pre-wrap leading-relaxed text-xs font-normal'>{para}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className='p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-3 border border-dashed rounded-xl bg-muted/10'>
            <FileText className='h-8 w-8 text-indigo-500/60' />
            <div className='space-y-1'>
              <p className='font-bold text-foreground text-sm'>No AI Summary Available</p>
              <p className='text-[11px] text-muted-foreground max-w-sm'>
                Summaries are synthesized automatically on load or when Inngest background events land.
              </p>
            </div>
            <Button
              variant='default'
              size='sm'
              onClick={async () => {
                try {
                  const res = await fetch("/api/inngest/trigger", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      eventName: "github.connected",
                      repositoryOwner: owner,
                      repositoryName: repo,
                    }),
                  });
                  const d = await res.json();
                  if (d.success) {
                    alert(`Dispatched AI summary background job for ${owner}/${repo}! Please refresh in a few seconds.`);
                    window.location.reload();
                  } else {
                    alert(`Trigger error: ${d.error}`);
                  }
                } catch (e) {
                  alert("Failed to dispatch Inngest sync.");
                }
              }}
              className='bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 h-8 text-xs font-bold shadow-md shadow-indigo-500/20 gap-1.5'
            >
              <Sparkles className='h-3.5 w-3.5' />
              Synthesize AI Summary Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
