/*
 * Component: SummaryDisplay
 * Description: Formatted component for displaying AI-generated 3-paragraph repository summaries
 * with copy functionality, tech stack tags, and metadata callouts.
 */

"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
    <Card className="border-primary/20 bg-muted/20 shadow-xs">
      <CardHeader className="p-4 pb-2 border-b bg-muted/30 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <div>
            <CardTitle className="text-sm font-semibold">
              Repository AI Summary — {owner}/{repo}
            </CardTitle>
            {generatedAt && (
              <CardDescription className="text-[11px] flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                Updated {formatDistanceToNow(new Date(generatedAt), { addSuffix: true })}
              </CardDescription>
            )}
          </div>
        </div>

        {summary && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Summary
              </>
            )}
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* Language & Branch Badges */}
        <div className="flex items-center gap-2 text-xs">
          {language && (
            <Badge variant="secondary" className="gap-1 text-[11px]">
              <Code2 className="h-3 w-3 text-primary" />
              {language}
            </Badge>
          )}
          {defaultBranch && (
            <Badge variant="outline" className="text-[11px]">
              Branch: {defaultBranch}
            </Badge>
          )}
        </div>

        {/* Paragraphs Display */}
        {paragraphs.length > 0 ? (
          <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
            {paragraphs.map((para, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-background border leading-relaxed">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {idx === 0
                    ? "1. Purpose & Core Value"
                    : idx === 1
                    ? "2. Architecture & Tech Stack"
                    : "3. Vitality & Activity Status"}
                </div>
                <p className="whitespace-pre-wrap">{para}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-2">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
            <p>No summary has been generated for this repository yet.</p>
            <p className="text-[11px] text-muted-foreground/70">
              Summaries are automatically synthesized by Inngest background jobs when repository events land.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
