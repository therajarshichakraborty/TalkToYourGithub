/*
 * Component: MarkdownRenderer
 * Description: Robust Markdown parser for rendering AI assistant response text in ChatUI.
 * Converts markdown links, tables, lists, and code blocks (with syntax highlighting & copy support) into styled shadcn UI components.
 */

"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  FileCode,
  Folder,
  GitBranch,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MarkdownRendererProps {
  content: string;
}

interface Block {
  type: "code" | "table" | "text";
  language?: string;
  code?: string;
  lines: string[];
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const blocks = parseMarkdownBlocks(content);

  return (
    <div className='space-y-3 text-sm leading-relaxed text-foreground'>
      {blocks.map((block, bIdx) => {
        if (block.type === "code" && block.code !== undefined) {
          return (
            <CodeBlock key={bIdx} code={block.code} language={block.language} />
          );
        }
        if (block.type === "table") {
          return <ParsedTable key={bIdx} lines={block.lines} />;
        }
        return <ParsedTextBlock key={bIdx} text={block.lines.join("\n")} />;
      })}
    </div>
  );
}

/**
 * Parses raw Markdown content into structured blocks (code blocks, tables, text)
 */
function parseMarkdownBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code block detection (fenced with ```)
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) {
        i++; // Consume closing ```
      }
      blocks.push({
        type: "code",
        language: language || "text",
        code: codeLines.join("\n"),
        lines: codeLines,
      });
      continue;
    }

    // 2. Table detection (| ... |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith("|") &&
        lines[i].trim().endsWith("|")
      ) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "table",
        lines: tableLines,
      });
      continue;
    }

    // 3. Normal text block
    const textLines: string[] = [];
    while (
      i < lines.length &&
      !lines[i].trim().startsWith("```") &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|"))
    ) {
      textLines.push(lines[i]);
      i++;
    }
    if (textLines.length > 0) {
      blocks.push({
        type: "text",
        lines: textLines,
      });
    }
  }

  return blocks;
}

/**
 * Sleek Code Block Component with Copy-to-Clipboard & Syntax Highlighting
 */
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = language || "code";

  return (
    <div className='my-3 rounded-xl border border-slate-800 bg-[#0d1117] text-slate-100 shadow-md overflow-hidden font-mono text-xs'>
      {/* Header bar */}
      <div className='flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-slate-800 text-slate-400 text-[11px] font-sans'>
        <div className='flex items-center gap-2 font-medium'>
          <FileCode className='h-3.5 w-3.5 text-indigo-400' />
          <span className='uppercase tracking-wider font-mono text-[10px] text-slate-300 font-semibold'>
            {displayLang}
          </span>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCopy}
          className='h-6 px-2 text-[10px] text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 gap-1 rounded-md transition-colors'
        >
          {copied ? (
            <>
              <Check className='h-3 w-3 text-emerald-400' />
              <span className='text-emerald-400 font-medium'>Copied!</span>
            </>
          ) : (
            <>
              <Copy className='h-3 w-3' />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code body with line numbers & tokenized syntax highlighting */}
      <div className='p-3.5 overflow-x-auto leading-relaxed bg-[#0d1117] selection:bg-indigo-500/30'>
        <div className='font-mono text-[12px] space-y-0.5'>
          {highlightCode(code, displayLang)}
        </div>
      </div>
    </div>
  );
}

/**
 * Line-by-line syntax tokenization engine
 */
function highlightCode(code: string, lang: string): React.ReactNode[] {
  const lines = code.split("\n");

  return lines.map((line, lineIdx) => (
    <div key={lineIdx} className='flex items-start text-left min-w-max'>
      <span className='select-none text-right pr-4 text-slate-600 text-[10px] min-w-[2.25rem] font-mono shrink-0 pt-0.5'>
        {lineIdx + 1}
      </span>
      <span className='whitespace-pre font-mono flex-1 text-slate-200'>
        {tokenizeLine(line, lang)}
      </span>
    </div>
  ));
}

/**
 * Tokenizes a single code line into syntax-highlighted React nodes
 */
function tokenizeLine(line: string, lang: string): React.ReactNode {
  if (!line) return "\n";

  // Regex pattern for comments, strings, keywords, types, numbers, function calls, and operators
  const tokenRegex =
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:class|public|private|protected|static|final|abstract|interface|implements|extends|void|int|long|short|byte|boolean|double|float|char|if|else|for|while|do|switch|case|break|continue|return|new|import|export|from|default|const|let|var|function|async|await|try|catch|finally|throw|type|struct|package|def|self|nil)\b|\b(?:true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b|@[A-Za-z0-9_]+|\b[A-Z][A-Za-z0-9_]*\b|\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()|[{}()[\];,.:=+\-*\/%<>!&|^~]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token.slice(0, 5)}`;

    // 1. Comments
    if (token.startsWith("//") || token.startsWith("/*")) {
      parts.push(
        <span key={key} className='text-slate-500 italic'>
          {token}
        </span>,
      );
    }
    // 2. Strings
    else if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'")) ||
      (token.startsWith("`") && token.endsWith("`"))
    ) {
      parts.push(
        <span key={key} className='text-emerald-400'>
          {token}
        </span>,
      );
    }
    // 3. Keywords
    else if (
      /^(class|public|private|protected|static|final|abstract|interface|implements|extends|void|int|long|short|byte|boolean|double|float|char|if|else|for|while|do|switch|case|break|continue|return|new|import|export|from|default|const|let|var|function|async|await|try|catch|finally|throw|type|struct|package|def|self|nil)$/.test(
        token,
      )
    ) {
      parts.push(
        <span key={key} className='text-purple-400 font-semibold'>
          {token}
        </span>,
      );
    }
    // 4. Booleans / null / undefined
    else if (/^(true|false|null|undefined)$/.test(token)) {
      parts.push(
        <span key={key} className='text-amber-400 font-semibold'>
          {token}
        </span>,
      );
    }
    // 5. Numbers
    else if (/^\d+(?:\.\d+)?$/.test(token)) {
      parts.push(
        <span key={key} className='text-amber-300'>
          {token}
        </span>,
      );
    }
    // 6. Annotations (e.g. @Override)
    else if (token.startsWith("@")) {
      parts.push(
        <span key={key} className='text-yellow-400 font-medium'>
          {token}
        </span>,
      );
    }
    // 7. Capitalized Class / Type Names (e.g. Solution, TreeNode, List, Integer, ArrayList)
    else if (/^[A-Z][A-Za-z0-9_]*$/.test(token)) {
      parts.push(
        <span key={key} className='text-sky-400 font-medium'>
          {token}
        </span>,
      );
    }
    // 8. Function / Method calls (followed by "(")
    else if (
      /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token) &&
      line
        .slice(match.index + token.length)
        .trim()
        .startsWith("(")
    ) {
      parts.push(
        <span key={key} className='text-blue-400 font-medium'>
          {token}
        </span>,
      );
    }
    // 9. Punctuation & Operators
    else if (/^[{}()[\];,.:=+\-*\/%<>!&|^~]+$/.test(token)) {
      parts.push(
        <span key={key} className='text-slate-400'>
          {token}
        </span>,
      );
    }
    // Fallback
    else {
      parts.push(token);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}

/**
 * Parses and renders Markdown tables into clean shadcn UI cards & tables
 */
function ParsedTable({ lines }: { lines: string[] }) {
  if (lines.length < 2) {
    return <ParsedTextBlock text={lines.join("\n")} />;
  }

  const parseRow = (rowStr: string) =>
    rowStr
      .trim()
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());

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
              <th
                key={i}
                className='px-4 py-2.5 font-bold uppercase text-[10px] tracking-wider'
              >
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

    const isDirectory =
      text.toLowerCase().includes("directory") || label.includes("/");
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

  if (text === "Directory" || text === "Folder") {
    return (
      <Badge
        variant='outline'
        className='gap-1 text-[10px] bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 text-indigo-700 dark:text-indigo-300 rounded-full px-2.5'
      >
        <Folder className='h-3 w-3 text-indigo-500' />
        Directory
      </Badge>
    );
  }

  if (text === "File") {
    return (
      <Badge
        variant='outline'
        className='gap-1 text-[10px] bg-muted/40 text-muted-foreground rounded-full px-2.5'
      >
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

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div
              key={idx}
              className='flex items-start gap-2 text-xs text-foreground pl-2'
            >
              <span className='text-indigo-500 font-bold mt-0.5'>•</span>
              <span className='flex-1 leading-relaxed'>
                {renderFormattedSpan(trimmed.slice(2))}
              </span>
            </div>
          );
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={idx}
              className='text-sm font-bold tracking-tight text-foreground pt-2'
            >
              {renderFormattedSpan(trimmed.slice(4))}
            </h4>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={idx}
              className='text-base font-bold tracking-tight text-foreground pt-2'
            >
              {renderFormattedSpan(trimmed.slice(3))}
            </h3>
          );
        }

        return (
          <p
            key={idx}
            className='text-xs sm:text-sm leading-relaxed text-foreground'
          >
            {renderFormattedSpan(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function cleanFormattedText(str: string): string {
  return str.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
}

function renderFormattedSpan(str: string): React.ReactNode {
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, i) => {
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

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className='font-bold text-foreground'>
          {part.slice(2, -2)}
        </strong>
      );
    }

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
