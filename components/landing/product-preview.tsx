"use client";

import { motion } from "motion/react";
import { Check, GitPullRequest, Search } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

const REPOS = [
  { name: "payments-api", lang: "Go", active: true },
  { name: "web-dashboard", lang: "TypeScript" },
  { name: "ml-pipeline", lang: "Python" },
  { name: "design-system", lang: "TypeScript" },
  { name: "infra", lang: "HCL" },
  { name: "mobile-app", lang: "Kotlin" },
];

const ROWS = [
  { pr: "#214", title: "Retry webhook delivery with backoff", age: "2d" },
  { pr: "#209", title: "Idempotency keys for refunds", age: "5d" },
  { pr: "#198", title: "Upgrade Stripe SDK to v15", age: "9d" },
];

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

export function ProductPreview() {
  return (
    <div className='relative mx-auto w-full max-w-5xl'>
      <div className='absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[2rem] bg-brand/10 blur-3xl' />
      <div className='overflow-hidden rounded-2xl border bg-card shadow-card'>
        <div className='flex h-10 items-center gap-2 border-b bg-muted/40 px-4'>
          <span className='size-2.5 rounded-full bg-foreground/15' />
          <span className='size-2.5 rounded-full bg-foreground/15' />
          <span className='size-2.5 rounded-full bg-foreground/15' />
          <span className='mx-auto font-mono text-[11px] text-muted-foreground'>
            app / payments-api
          </span>
        </div>

        <div className='grid min-h-[380px] grid-cols-1 md:grid-cols-[220px_1fr]'>
          <aside className='hidden border-r bg-muted/20 p-3 md:block'>
            <div className='mb-3 flex h-8 items-center gap-2 rounded-md border bg-background px-2.5 text-xs text-muted-foreground'>
              <Search className='size-3.5' />
              Search 73 repositories
            </div>
            <ul className='space-y-0.5'>
              {REPOS.map((repo) => (
                <li
                  key={repo.name}
                  className={
                    repo.active
                      ? "flex items-center justify-between rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium"
                      : "flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-muted-foreground"
                  }
                >
                  <span className='truncate'>{repo.name}</span>
                  <span className='font-mono text-[10px] text-muted-foreground'>
                    {repo.lang}
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          <div className='flex flex-col gap-4 p-5 text-left md:p-6'>
            <motion.div {...reveal(0.3)} className='ml-auto max-w-sm rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground'>
              Which open PRs are blocking the next release?
            </motion.div>

            <motion.div {...reveal(0.9)} className='flex flex-wrap gap-2'>
              {["getPullRequests", "getIssues"].map((tool) => (
                <span
                  key={tool}
                  className='inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground'
                >
                  <Check className='size-3 text-success' />
                  {tool}
                </span>
              ))}
            </motion.div>

            <motion.div {...reveal(1.4)} className='flex gap-3'>
              <LogoMark className='size-6 shrink-0 rounded-md' />
              <div className='min-w-0 flex-1 space-y-3 text-sm'>
                <p>
                  Three open PRs touch the release milestone. <strong>#214</strong>{" "}
                  is the only one with failing checks.
                </p>
                <div className='overflow-hidden rounded-lg border'>
                  {ROWS.map((row, i) => (
                    <motion.div
                      key={row.pr}
                      {...reveal(1.7 + i * 0.12)}
                      className='flex items-center gap-3 border-b px-3 py-2 text-xs last:border-b-0'
                    >
                      <GitPullRequest className='size-3.5 shrink-0 text-success' />
                      <span className='font-mono text-muted-foreground'>{row.pr}</span>
                      <span className='truncate'>{row.title}</span>
                      <span className='ml-auto font-mono text-muted-foreground'>
                        {row.age}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
