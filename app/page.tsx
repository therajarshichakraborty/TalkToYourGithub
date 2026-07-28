"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  GitBranch,
  GitPullRequest,
  MessageSquare,
  Search,
  Terminal,
} from "lucide-react";
import Link from "next/link";

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div className="flex items-center justify-between rounded-full border border-border/80 bg-white/80 dark:bg-black/80 p-2 pl-5 pr-2 shadow-sm backdrop-blur-md transition-all">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
            <Terminal className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            TalkToYourGitHub
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            href="#features"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#preview"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Overview
          </Link>
          <Link
            href="#how-it-works"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Architecture
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <AnimatedThemeToggler
            variant="circle"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          />
          <Button size="sm" className="h-8 rounded-full px-4 text-xs" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-16 pb-16 sm:pt-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        {/* Left Column: Copy & Actions */}
        <div className="flex flex-col items-start text-left">

          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.1]">
            Talk to your GitHub repositories in natural language.
          </h1>

          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Connect your workspace to query commits, branches, pull requests, and
            issues using plain questions. Powered by direct database syncing and live proxies.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="rounded-full px-6" asChild>
              <Link href="/sign-in" className="flex items-center gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-6 border-border/80"
              asChild
            >
              <Link href="#features">Explore features</Link>
            </Button>
          </div>
        </div>

        {/* Right Column: Terminal Preview Card */}
        <div id="preview" className="w-full">
          <Card className="overflow-hidden border border-border/80 bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
                <div className="h-2.5 w-2.5 rounded-full bg-foreground/20" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  TalkToYourGithub
                </span>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Live Sync
              </Badge>
            </div>
            <CardContent className="space-y-4 p-6 font-mono text-xs">
              <div className="flex items-start gap-3 text-foreground">
                <span className="text-muted-foreground">&gt;</span>
                <p className="font-sans text-xs font-medium text-foreground">
                  Which branches have unmerged commits relating to the auth refactor?
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4 font-sans text-xs leading-relaxed text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 text-foreground font-semibold">
                  <GitBranch className="h-3.5 w-3.5" />
                  Found 2 active branches matching query:
                </div>
                <ul className="space-y-1.5 pl-4 list-disc">
                  <li>
                    <strong className="text-foreground">feature/auth-refactor</strong> — 4 commits ahead of main.
                  </li>
                  <li>
                    <strong className="text-foreground">fix/session-store</strong> — 1 commit ahead, pending PR #42.
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Search,
    title: "Semantic Code Base Search",
    description:
      "Query commits, file history, and branch differences without memorizing git CLI commands.",
  },
  {
    icon: MessageSquare,
    title: "Conversational Issue Triage",
    description:
      "Ask which issues block a release, who owns open tasks, and track project status instantly.",
  },
  {
    icon: GitPullRequest,
    title: "Pull Request Intelligence",
    description:
      "Summarize active PRs, detect code review bottlenecks, and surface stale contributions.",
  },
] as const;

function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-6 py-20">
      <div className="mb-12 text-center sm:text-left">
        <Badge
          variant="outline"
          className="mb-3 rounded-full border-border/80 text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          Capabilities
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Engineered for developer workflows.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Built on hybrid local database caching and real-time GitHub API proxies.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            className="group border border-border/80 bg-background transition-all duration-200 hover:border-foreground/30 hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
              <CardTitle className="text-base font-semibold leading-snug text-foreground">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// ─── CTA Band ─────────────────────────────────────────────────────────────────

function CtaBand() {
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-2xl border border-border/80 bg-muted/30 p-8 sm:p-12">
        <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
          <div className="space-y-3 text-left">
            <Badge
              variant="outline"
              className="rounded-full border-border/80 text-[11px] text-muted-foreground"
            >
              Fast Setup
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Ready to talk to your repositories?
            </h2>
            <p className="max-w-md text-xs sm:text-sm text-muted-foreground">
              Connect your GitHub account in less than a minute. Works seamlessly with private and public repos.
            </p>
          </div>
          <div className="flex sm:justify-end">
            <Button size="lg" className="w-full sm:w-auto rounded-full px-7 text-xs sm:text-sm" asChild>
              <Link href="/sign-in" className="flex items-center justify-center gap-2">
                Connect GitHub Repository
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-6 py-10">
      <Separator className="mb-8 opacity-60" />
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold">
            T
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            TalkToYourGitHub. All rights reserved.
          </span>
        </div>
        <nav className="flex flex-wrap gap-6">
          {(
            [
              ["Privacy", "#"],
              ["Terms", "#"],
              ["Documentation", "#"],
              ["Status", "#"],
            ] as const
          ).map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-foreground antialiased selection:bg-foreground selection:text-background">
      <Nav />
      <Hero />
      <Features />
      <CtaBand />
      <Footer />
    </div>
  );
}
