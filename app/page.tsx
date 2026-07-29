"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  GitBranch,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Search,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Nav() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
  };

  return (
    <header className='sticky top-6 z-50 mx-auto w-full max-w-5xl px-4 sm:px-6'>
      <div className='flex items-center justify-between rounded-2xl border border-border/80 bg-white/80 dark:bg-black/80 p-2 pl-5 pr-2 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-border'>
        <Link href='/' className='flex items-center gap-2.5 group'>
          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background transition-transform duration-300 group-hover:scale-110'>
            <Terminal className='h-3.5 w-3.5' />
          </div>
          <span className='text-base font-normal tracking-tight text-foreground font-[family-name:var(--font-pacifico)]'>
            TalkToYourGitHub
          </span>
        </Link>

        <nav className='hidden items-center gap-6 sm:flex'>
          <Link
            href='#features'
            className='text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground font-[family-name:var(--font-amatic-sc)]'
          >
            Features
          </Link>
          <Link
            href='#preview'
            className='text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground font-[family-name:var(--font-amatic-sc)]'
          >
            Overview
          </Link>
          <Link
            href='#how-it-works'
            className='text-base font-bold tracking-wider text-muted-foreground transition-colors hover:text-foreground font-[family-name:var(--font-amatic-sc)]'
          >
            Architecture
          </Link>
        </nav>

        <div className='flex items-center gap-2'>
          <AnimatedThemeToggler
            variant='circle'
            className='flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          />
          {session?.user ? (
            <Button
              size='sm'
              variant='outline'
              onClick={handleSignOut}
              className='h-8 rounded-full px-5 text-base font-bold tracking-wider border-border/80 transition-transform active:scale-95 font-[family-name:var(--font-amatic-sc)]'
            >
              Sign out
            </Button>
          ) : (
            <Button
              size='sm'
              className='h-8 rounded-full px-5 text-base font-bold tracking-wider shadow-none transition-transform active:scale-95 font-[family-name:var(--font-amatic-sc)]'
              asChild
            >
              <Link href='/sign-in'>Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className='mx-auto max-w-5xl px-6 pt-16 pb-16 sm:pt-24 animate-in fade-in slide-in-from-bottom-4 duration-700'>
      <div className='grid gap-12 lg:grid-cols-2 lg:items-center'>
        {/* Left Column: Copy & Actions */}
        <div className='flex flex-col items-start text-left'>
          <div className='mb-6 flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-4 py-1 text-sm font-bold tracking-widest text-muted-foreground backdrop-blur-sm font-[family-name:var(--font-amatic-sc)]'>
            <span className='relative flex h-2 w-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-75' />
              <span className='relative inline-flex h-2 w-2 rounded-full bg-foreground' />
            </span>
            Real-time GitHub Repository Intelligence
          </div>

          <h1 className='text-3xl font-normal tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight font-[family-name:var(--font-permanent-marker)]'>
            Talk to your repositories in natural language.
          </h1>

          <p className='mt-4 text-base font-normal text-muted-foreground sm:text-lg leading-relaxed font-[family-name:var(--font-pacifico)]'>
            Query commits, branches, pull requests, and issues using plain
            questions. Powered by high-performance local database caching and
            live API proxies.
          </p>

          <div className='mt-8 flex flex-wrap items-center gap-3'>
            <Button
              size='lg'
              className='rounded-full px-6 text-sm font-normal shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 font-[family-name:var(--font-permanent-marker)]'
              asChild
            >
              <Link href='/sign-in' className='flex items-center gap-2'>
                Get started free
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='rounded-full px-6 border-border/80 text-sm font-normal transition-all duration-300 hover:bg-muted/50 font-[family-name:var(--font-permanent-marker)]'
              asChild
            >
              <Link href='#features'>Explore features</Link>
            </Button>
          </div>
        </div>

        {/* Right Column: Terminal Preview Card */}
        <div id='preview' className='w-full'>
          <Card className='overflow-hidden border border-border/80 bg-white dark:bg-black shadow-2xl transition-all duration-300 hover:border-foreground/30'>
            <div className='flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3'>
              <div className='flex items-center gap-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-foreground/30' />
                <div className='h-2.5 w-2.5 rounded-full bg-foreground/30' />
                <div className='h-2.5 w-2.5 rounded-full bg-foreground/30' />
                <span className='ml-2 font-normal text-xs text-muted-foreground font-[family-name:var(--font-pacifico)]'>
                  TalkToYourGithub
                </span>
              </div>
              <Badge
                variant='secondary'
                className='font-bold text-xs uppercase tracking-wider font-[family-name:var(--font-amatic-sc)]'
              >
                Live Sync
              </Badge>
            </div>
            <CardContent className='space-y-4 p-6 text-xs'>
              <div className='flex items-start gap-2.5 text-foreground font-[family-name:var(--font-pacifico)]'>
                <span className='text-muted-foreground'>&gt;</span>
                <p className='text-xs font-normal text-foreground'>
                  Which branches have unmerged commits for the auth refactor?
                  <span className='ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-foreground vertical-middle' />
                </p>
              </div>
              <div className='rounded-lg border border-border/60 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground font-[family-name:var(--font-pacifico)]'>
                <div className='mb-2 flex items-center gap-2 text-foreground font-semibold'>
                  <GitBranch className='h-3.5 w-3.5' />
                  Found 2 active branches matching query:
                </div>
                <ul className='space-y-2 pl-4 list-disc'>
                  <li>
                    <strong className='text-foreground'>
                      feature/auth-refactor
                    </strong>{" "}
                    — 4 commits ahead of main.
                  </li>
                  <li>
                    <strong className='text-foreground'>
                      fix/session-store
                    </strong>{" "}
                    — 1 commit ahead, pending PR #42.
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

const features = [
  {
    icon: Search,
    title: "Semantic Code Search",
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
  {
    icon: GitCommit,
    title: "Commit & Blame Context",
    description:
      "Inspect recent commit histories, author metrics, and code modifications effortlessly.",
  },
  {
    icon: Zap,
    title: "Hybrid Data Caching",
    description:
      "Enjoy sub-millisecond local query responses with seamless fallback to live GitHub APIs.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-Tenant Isolation",
    description:
      "Keep workspace data strictly compartmentalized with tenant-scoped authentication controls.",
  },
] as const;

function Features() {
  return (
    <section id='features' className='mx-auto max-w-5xl px-6 py-24'>
      <div className='mb-16 text-center sm:text-left'>
        <Badge
          variant='outline'
          className='mb-3 rounded-full border-border/80 text-sm font-bold uppercase tracking-widest text-muted-foreground font-[family-name:var(--font-amatic-sc)]'
        >
          Capabilities
        </Badge>
        <h2 className='text-2xl font-normal tracking-tight text-foreground sm:text-3xl font-[family-name:var(--font-permanent-marker)]'>
          Engineered for modern developer teams.
        </h2>
        <p className='mt-2 text-base text-muted-foreground max-w-lg font-[family-name:var(--font-pacifico)]'>
          Complete visibility across your repositories with natural language
          intelligence.
        </p>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {features.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            className='group border border-border/80 bg-white dark:bg-black transition-all duration-300 hover:border-foreground/40 hover:-translate-y-1 hover:shadow-xl'
          >
            <CardHeader className='pb-3'>
              <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-foreground transition-colors duration-300 group-hover:bg-foreground group-hover:text-background'>
                <Icon className='h-5 w-5' strokeWidth={1.5} />
              </div>
              <CardTitle className='text-xl font-normal leading-snug text-foreground font-[family-name:var(--font-permanent-marker)]'>
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-base font-semibold leading-relaxed text-muted-foreground font-[family-name:var(--font-amatic-sc)] tracking-wider'>
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CtaBand() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
          router.refresh();
        },
      },
    });
  };

  return (
    <section id='how-it-works' className='mx-auto max-w-5xl px-6 py-16'>
      <div className='rounded-2xl border border-border/80 bg-muted/20 p-8 sm:p-12 transition-all duration-300 hover:border-foreground/30'>
        <div className='grid gap-8 sm:grid-cols-2 sm:items-center'>
          <div className='space-y-3 text-left'>
            <Badge
              variant='outline'
              className='rounded-full border-border/80 text-sm font-bold text-muted-foreground font-[family-name:var(--font-amatic-sc)] tracking-wider'
            >
              Fast Setup
            </Badge>
            <h2 className='text-2xl font-normal tracking-tight text-foreground sm:text-3xl font-[family-name:var(--font-permanent-marker)]'>
              Ready to talk to your repositories?
            </h2>
            <p className='max-w-md text-base font-semibold text-muted-foreground font-[family-name:var(--font-amatic-sc)] tracking-wider'>
              Connect your GitHub account in less than a minute. Works
              seamlessly with private and public repos.
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-3 sm:justify-end'>
            {session?.user && (
              <Button
                size='lg'
                variant='outline'
                onClick={handleSignOut}
                className='w-full sm:w-auto rounded-full px-6 text-sm font-normal border-border/80 transition-transform active:scale-95 font-[family-name:var(--font-permanent-marker)]'
              >
                Sign out
              </Button>
            )}
            <Button
              size='lg'
              className='w-full sm:w-auto rounded-full px-7 text-sm font-normal shadow-md transition-transform active:scale-95 font-[family-name:var(--font-permanent-marker)]'
              asChild
            >
              <Link
                href='/sign-in'
                className='flex items-center justify-center gap-2'
              >
                {session?.user
                  ? "Re-authorize GitHub"
                  : "Connect GitHub Repository"}
                <ArrowRight className='h-4 w-4' />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className='mx-auto w-full max-w-5xl px-6 py-10'>
      <Separator className='mb-8 opacity-60' />
      <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
        <div className='flex items-center gap-2'>
          <div className='flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold'>
            T
          </div>
          <span className='text-base text-muted-foreground font-semibold font-[family-name:var(--font-amatic-sc)] tracking-wider'>
            TalkToYourGitHub. All rights reserved.
          </span>
        </div>
        <nav className='flex flex-wrap gap-6'>
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
              className='text-base font-semibold tracking-wider text-muted-foreground transition-colors hover:text-foreground font-[family-name:var(--font-amatic-sc)]'
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className='min-h-screen bg-white dark:bg-black text-foreground antialiased selection:bg-foreground selection:text-background relative'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-40' />
      <div className='relative z-10'>
        <Nav />
        <Hero />
        <Features />
        <CtaBand />
        <Footer />
      </div>
    </div>
  );
}
