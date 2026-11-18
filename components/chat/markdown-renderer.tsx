"use client";

import { Check, Copy } from "lucide-react";
import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";

type Block =
  | { kind: "code"; lang: string; code: string }
  | { kind: "table"; rows: string[][] }
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "rule" }
  | { kind: "paragraph"; text: string };

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isSeparatorRow = (line: string) =>
  /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
const LIST_ITEM = /^\s*(?:[-*+]|(\d+)[.)])\s+(.*)$/;

function sanitize(markdown: string) {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "");
}

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

function parse(markdown: string): Block[] {
  const lines = sanitize(markdown).split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```"))
        code.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", lang, code: code.join("\n") });
      continue;
    }

    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isSeparatorRow(lines[i + 1])
    ) {
      const rows = [splitRow(line)];
      i += 2;
      while (i < lines.length && isTableRow(lines[i]))
        rows.push(splitRow(lines[i++]));
      blocks.push({ kind: "table", rows });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      i++;
      continue;
    }

    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      blocks.push({ kind: "rule" });
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i++].trim().replace(/^>\s?/, ""));
      }
      blocks.push({ kind: "quote", text: quote.join(" ") });
      continue;
    }

    const listMatch = line.match(LIST_ITEM);
    if (listMatch) {
      const ordered = Boolean(listMatch[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(LIST_ITEM);
        if (m && Boolean(m[1]) === ordered) {
          items.push(m[2]);
          i++;
        } else if (
          lines[i].trim() &&
          /^\s{2,}/.test(lines[i]) &&
          items.length
        ) {
          items[items.length - 1] += ` ${lines[i++].trim()}`;
        } else break;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !/^#{1,6}\s/.test(lines[i].trim()) &&
      !LIST_ITEM.test(lines[i]) &&
      !(isTableRow(lines[i]) && isSeparatorRow(lines[i + 1] ?? ""))
    ) {
      paragraph.push(lines[i++].trim());
    }
    if (paragraph.length)
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    else i++;
  }

  return blocks;
}

function safeHref(url: string) {
  return /^(https?:\/\/|mailto:|\/(?![/\\])|#)/i.test(url) ? url : undefined;
}

const INLINE =
  /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|\[[^\]]+\]\([^)\s]+\))/g;

function Inline({ text }: { text: string }) {
  const parts = text.split(INLINE).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={i}
              className='rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.85em]'
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (/^(\*\*|__).*\1$/.test(part)) {
          return (
            <strong key={i} className='font-semibold'>
              <Inline text={part.slice(2, -2)} />
            </strong>
          );
        }
        if (/^([*_]).*\1$/.test(part)) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          const href = safeHref(link[2]);
          return href ? (
            <a
              key={i}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel='noreferrer'
              className='font-medium text-brand underline-offset-4 hover:underline'
            >
              {link[1]}
            </a>
          ) : (
            <Fragment key={i}>{link[1]}</Fragment>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

const KEYWORDS = new Set(
  "import export from default const let var function async await return if else for while do switch case break continue new class extends implements interface type enum public private protected static readonly try catch finally throw def self None True False nil package func struct go fn pub use mod match impl trait in of as".split(
    " ",
  ),
);
const TOKEN =
  /(\/\/.*$|#.*$|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;
const HASH_COMMENT_LANGS = new Set([
  "py",
  "python",
  "sh",
  "bash",
  "shell",
  "zsh",
  "yaml",
  "yml",
  "toml",
  "rb",
  "ruby",
  "dockerfile",
]);

function highlight(line: string, lang: string) {
  const hashComments = HASH_COMMENT_LANGS.has(lang.toLowerCase());
  const parts = line.split(TOKEN).filter((p) => p !== "");
  return parts.map((token, i) => {
    let cls = "";
    if (
      token.startsWith("//") ||
      token.startsWith("/*") ||
      (hashComments && token.startsWith("#"))
    ) {
      cls = "text-muted-foreground italic";
    } else if (/^["'`]/.test(token))
      cls = "text-emerald-600 dark:text-emerald-400";
    else if (/^\d/.test(token)) cls = "text-amber-600 dark:text-amber-300";
    else if (KEYWORDS.has(token)) cls = "text-violet-600 dark:text-violet-400";
    else if (/^(true|false|null|undefined)$/.test(token))
      cls = "text-amber-600 dark:text-amber-300";
    else if (/^[A-Z]/.test(token)) cls = "text-sky-600 dark:text-sky-400";
    return cls ? (
      <span key={i} className={cls}>
        {token}
      </span>
    ) : (
      <Fragment key={i}>{token}</Fragment>
    );
  });
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className='overflow-hidden rounded-lg border bg-muted/40'>
      <div className='flex items-center justify-between border-b px-3 py-1.5'>
        <span className='font-mono text-[11px] text-muted-foreground'>
          {lang || "text"}
        </span>
        <button
          type='button'
          onClick={copy}
          aria-label='Copy code'
          className='inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground'
        >
          {copied ? <Check className='size-3' /> : <Copy className='size-3' />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className='overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed'>
        {code.split("\n").map((line, i) => (
          <div key={i} className='min-h-lh'>
            {highlight(line, lang)}
          </div>
        ))}
      </pre>
    </div>
  );
}

const HEADING_STYLES = [
  "text-xl font-semibold tracking-tight",
  "text-lg font-semibold tracking-tight",
  "text-base font-semibold",
  "text-sm font-semibold",
];

export function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parse(content);

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed", className)}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "code":
            return <CodeBlock key={i} lang={block.lang} code={block.code} />;
          case "table": {
            const [head, ...body] = block.rows;
            return (
              <div key={i} className='overflow-x-auto rounded-lg border'>
                <table className='w-full text-left text-xs'>
                  <thead className='border-b bg-muted/40 text-muted-foreground'>
                    <tr>
                      {head.map((cell, c) => (
                        <th key={c} className='px-3 py-2 font-medium'>
                          <Inline text={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {body.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className='px-3 py-2 align-top'>
                            <Inline text={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          case "heading":
            return (
              <p
                key={i}
                role='heading'
                aria-level={block.level + 1}
                className={cn(
                  "pt-2",
                  HEADING_STYLES[Math.min(block.level, 4) - 1],
                )}
              >
                <Inline text={block.text} />
              </p>
            );
          case "list": {
            const ListTag = block.ordered ? "ol" : "ul";
            return (
              <ListTag
                key={i}
                className={cn(
                  "space-y-1 pl-5 marker:text-muted-foreground",
                  block.ordered ? "list-decimal" : "list-disc",
                )}
              >
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ListTag>
            );
          }
          case "quote":
            return (
              <blockquote
                key={i}
                className='border-l-2 pl-4 text-muted-foreground'
              >
                <Inline text={block.text} />
              </blockquote>
            );
          case "rule":
            return <hr key={i} className='border-border' />;
          default:
            return (
              <p key={i}>
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
