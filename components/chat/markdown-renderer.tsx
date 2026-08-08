/*
 * Component: MarkdownRenderer
 * Description: Lightweight, robust Markdown & Table parser for rendering AI assistant response text in ChatUI.
 * Converts markdown links, tables, lists, and code blocks into styled shadcn UI components.
 */

"use client";

import React from "react";
import { ExternalLink, FileCode, Folder, GitBranch, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content into blocks by double newlines or table boundaries
  const lines = content.split("\n");
  const blocks: Array<{ type: "table" | "text"; lines: string[] }> = [];

  let currentBlock: { type: "table" | "text"; lines: string[] } | null = null;

  for (const line of lines) {
    const isTableLine = line.trim().startsWith("|") && line.trim().endsWith("|");
    
    if (isTableLine) {
      if (currentBlock?.type === "table") {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: "table", lines: [line] };
      }
    } else {
      if (currentBlock?.type === "text") {
        currentBlock.lines.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: "text", lines: [line] };
      }
    }
  }
  if (currentBlock) blocks.push(currentBlock);

  return (
    <div className='space-y-3 text-sm leading-relaxed text-foreground'>
      {blocks.map((block, bIdx) => {
        if (block.type === "table") {
          return <ParsedTable key={bIdx} lines={block.lines} />;
        }
        return <ParsedTextBlock key={bIdx} text={block.lines.join("\n")} />;
      })}
    </div>
  );
}

/**
 * Parses and renders Markdown tables into clean shadcn UI cards & tables
 */
function ParsedTable({ lines }: { lines: string[] }) {
  if (lines.length < 2) {
    return <ParsedTextBlock text={lines.join("\n")} />;
  }

  // Helper to split a table row by pipe '|'
  const parseRow = (rowStr: string) =>
    rowStr
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());

  // Filter out divider lines like |---|---|
  const isSeparator = (line: string) => line.includes("---");
  const headerRow = parseRow(lines[0]);
  
  const bodyRows = lines
    .slice(1)
    .filter((l) => !isSeparator(l))
    .map(parseRow);

  return (
    <div className='my-3 overflow-x-auto rounded-2xl border border-border/80 bg-card/90 shadow-xs'>
      <table className='w-full text-left text-xs'>
        <thead className='border-b bg-muted/40 text-muted-foreground font-semibold'>
          <tr>
            {headerRow.map((h, i) => (
              <th key={i} className='px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider'>
                {cleanFormattedText(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y divide-border/40 text-foreground font-medium'>
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className='hover:bg-muted/30 transition-colors'>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className='px-4 py-2.5 align-middle'>
                  <TableCellContent text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders cell content with smart icon indicators for files, folders, PRs, and links
 */
function TableCellContent({ text }: { text: string }) {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/;
  const linkMatch = text.match(markdownLinkRegex);

  if (linkMatch) {
    const label = linkMatch[1];
    const url = linkMatch[2];

    const isDirectory = text.toLowerCase().includes("directory") || label.includes("/");
    const isFile = text.toLowerCase().includes("file") || label.includes(".");

    return (
      <a
        href={url}
        target='_blank'
        rel='noreferrer'
        className='inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors group'
      >
        {isDirectory ? (
          <Folder className='h-3.5 w-3.5 text-indigo-500 shrink-0' />
        ) : isFile ? (
          <FileCode className='h-3.5 w-3.5 text-indigo-500 shrink-0' />
        ) : (
          <ArrowUpRight className='h-3.5 w-3.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity' />
        )}
        <span>{label}</span>
      </a>
    );
  }

  // If text is a type like "File" or "Directory"
  if (text === "Directory" || text === "Folder") {
    return (
      <Badge variant='outline' className='gap-1 text-[10px] bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 text-indigo-700 dark:text-indigo-300 rounded-full px-2.5'>
        <Folder className='h-3 w-3 text-indigo-500' />
        Directory
      </Badge>
    );
  }

  if (text === "File") {
    return (
      <Badge variant='outline' className='gap-1 text-[10px] bg-muted/40 text-muted-foreground rounded-full px-2.5'>
        <FileCode className='h-3 w-3' />
        File
      </Badge>
    );
  }

  return <span>{cleanFormattedText(text)}</span>;
}

/**
 * Parses normal text blocks with bullet points, links, bold formatting, and inline code
 */
function ParsedTextBlock({ text }: { text: string }) {
  const paragraphs = text.split("\n");

  return (
    <div className='space-y-1.5'>
      {paragraphs.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Bullet lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className='flex items-start gap-2 text-xs text-foreground pl-2'>
              <span className='text-indigo-500 font-bold mt-0.5'>•</span>
              <span className='flex-1 leading-relaxed'>{renderFormattedSpan(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Headers
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className='text-sm font-bold tracking-tight text-foreground pt-2'>
              {renderFormattedSpan(trimmed.slice(4))}
            </h4>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className='text-base font-bold tracking-tight text-foreground pt-2'>
              {renderFormattedSpan(trimmed.slice(3))}
            </h3>
          );
        }

        return (
          <p key={idx} className='text-xs sm:text-sm leading-relaxed text-foreground'>
            {renderFormattedSpan(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Strips raw markdown link brackets for headers/cells
 */
function cleanFormattedText(str: string): string {
  return str.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
}

/**
 * Helper to convert markdown bold **text**, inline `code`, and [links](url) to JSX spans
 */
function renderFormattedSpan(str: string): React.ReactNode {
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, i) => {
    // Check if link
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const url = linkMatch[2];
      return (
        <a
          key={i}
          href={url}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 transition-colors'
        >
          <span>{label}</span>
          <ArrowUpRight className='h-3 w-3 opacity-75' />
        </a>
      );
    }

    // Check if bold
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className='font-bold text-foreground'>
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Check if inline code
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className='px-1.5 py-0.5 rounded bg-muted/60 font-mono text-[11px] text-foreground border border-border/50'
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}
