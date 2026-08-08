"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  LogOut,
  User as UserIcon,
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

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "GH";

  return (
    <header className='sticky top-6 z-50 mx-auto w-full max-w-5xl px-4 sm:px-6'>
      <div className='flex items-center justify-between rounded-full border border-border/80 bg-background/85 p-2 pl-6 pr-3 shadow-xl shadow-indigo-500/5 backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30'>
        <Link href='/' className='flex items-center gap-3 group'>
          <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110'>
            <Terminal className='h-4 w-4' />
          </div>
          <span className='text-base font-bold tracking-tight text-foreground'>
            TalkToYourGitHub
          </span>
        </Link>

        <nav className='hidden items-center gap-6 sm:flex text-xs font-semibold'>
          <Link
            href='#features'
            className='text-muted-foreground transition-colors hover:text-indigo-600'
          >
            Features
          </Link>
          <Link
            href='#preview'
            className='text-muted-foreground transition-colors hover:text-indigo-600'
          >
            Overview
          </Link>
          <Link
            href='#how-it-works'
            className='text-muted-foreground transition-colors hover:text-indigo-600'
          >
            Architecture
          </Link>
        </nav>

        <div className='flex items-center gap-2.5'>
          <AnimatedThemeToggler
            variant='circle'
            className='flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40'
          />
          {session?.user ? (
            <div className='flex items-center gap-2.5'>
              <Button
                size='sm'
                className='h-8 rounded-full px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5'
                asChild
              >
                <Link href='/dashboard'>
                  <span>Go to Dashboard</span>
                  <ArrowRight className='h-3.5 w-3.5' />
                </Link>
              </Button>

              {/* User Avatar with Sign Out onClick */}
              <button
                onClick={handleSignOut}
                title={`Signed in as ${session.user.name || session.user.email} (Click to Sign out)`}
                className='group relative flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/40 transition-all active:scale-95'
              >
                <Avatar className='h-8 w-8 rounded-full border border-indigo-200 dark:border-indigo-900/60 shadow-xs'>
                  <AvatarImage
                    src={session.user.image || ""}
                    alt={session.user.name || "User"}
                  />
                  <AvatarFallback className='bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold'>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>
          ) : (
            <Button
              size='sm'
              className='h-8 rounded-full px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/25 transition-transform active:scale-95'
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
  const { data: session } = authClient.useSession();

  return (
    <section className='relative mx-auto max-w-5xl px-6 pt-16 pb-16 sm:pt-24 animate-in fade-in slide-in-from-bottom-4 duration-700'>
      <div className='absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none' />

      <div className='grid gap-12 lg:grid-cols-2 lg:items-center relative z-10'>
        {/* Left Column: Copy & Actions */}
        <div className='flex flex-col items-start text-left'>
          <div className='mb-6 flex items-center gap-2.5 rounded-full border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/40 px-4 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 backdrop-blur-sm shadow-xs'>
            <span className='relative flex h-2 w-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-600 opacity-75' />
              <span className='relative inline-flex h-2 w-2 rounded-full bg-indigo-600' />
            </span>
            Real-time GitHub Repository Intelligence
          </div>

          <h1 className='text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-tight'>
            Talk to your repositories in natural language.
          </h1>

          <p className='mt-4 text-base font-normal text-muted-foreground sm:text-lg leading-relaxed'>
            Query commits, branches, pull requests, and issues using plain
            questions. Powered by high-performance RAG vector embeddings, LangChain text splitting, and live API proxies.
          </p>

          <div className='mt-8 flex flex-wrap items-center gap-3'>
            {session?.user ? (
              <Button
                size='lg'
                className='rounded-full px-7 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95'
                asChild
              >
                <Link href='/dashboard' className='flex items-center gap-2'>
                  Go to Dashboard
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            ) : (
              <Button
                size='lg'
                className='rounded-full px-7 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-95'
                asChild
              >
                <Link href='/sign-in' className='flex items-center gap-2'>
                  Get started free
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            )}
            <Button
              size='lg'
              variant='outline'
              className='rounded-full px-6 border-border/80 text-sm font-semibold transition-all duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
              asChild
            >
              <Link href='#features'>Explore features</Link>
            </Button>
          </div>
        </div>

        {/* Right Column: Terminal Preview Card */}
        <div id='preview' className='w-full'>
          <Card className='overflow-hidden border border-border/80 bg-card/90 shadow-2xl transition-all duration-300 hover:border-indigo-500/40 rounded-3xl'>
            <div className='flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3'>
              <div className='flex items-center gap-2'>
                <div className='h-2.5 w-2.5 rounded-full bg-rose-500' />
                <div className='h-2.5 w-2.5 rounded-full bg-amber-500' />
                <div className='h-2.5 w-2.5 rounded-full bg-emerald-500' />
                <span className='ml-2 font-mono font-semibold text-xs text-muted-foreground'>
                  TalkToYourGitHub
                </span>
              </div>
              <Badge
                variant='secondary'
                className='font-bold text-[10px] uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-none'
              >
                Live Sync
              </Badge>
            </div>
            <CardContent className='space-y-4 p-6 text-xs font-mono'>
              <div className='flex items-start gap-2.5 text-foreground'>
                <span className='text-indigo-600 font-bold'>&gt;</span>
                <p className='text-xs font-medium text-foreground'>
                  Which branches have unmerged commits for the auth refactor?
                  <span className='ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-indigo-600 vertical-middle' />
                </p>
              </div>
              <div className='rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 text-xs leading-relaxed text-muted-foreground'>
                <div className='mb-2 flex items-center gap-2 text-foreground font-semibold'>
                  <GitBranch className='h-3.5 w-3.5 text-indigo-600' />
                  Found 2 active branches matching query:
                </div>
                <ul className='space-y-2 pl-4 list-disc'>
                  <li>
                    <strong className='text-foreground'>
                      feature/auth-refactor
                    </strong>{" "}
                    | 4 commits ahead of main.
                  </li>
                  <li>
                    <strong className='text-foreground'>
                      fix/session-store
                    </strong>{" "}
                    | 1 commit ahead, pending PR #42.
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

function StatsBand() {
  return (
    <section className='mx-auto max-w-5xl px-6 py-6'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-sm'>
        <div className='space-y-1 text-center sm:text-left'>
          <div className='text-2xl font-extrabold tracking-tight text-foreground font-mono'>
            40+
          </div>
          <div className='text-xs text-muted-foreground font-medium'>
            Connected Repositories
          </div>
        </div>
        <div className='space-y-1 text-center sm:text-left'>
          <div className='text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 font-mono'>
            &lt; 800ms
          </div>
          <div className='text-xs text-muted-foreground font-medium'>
            Sub-second RAG Query
          </div>
        </div>
        <div className='space-y-1 text-center sm:text-left'>
          <div className='text-2xl font-extrabold tracking-tight text-foreground font-mono'>
            100%
          </div>
          <div className='text-xs text-muted-foreground font-medium'>
            Type-Safe Drizzle DB
          </div>
        </div>
        <div className='space-y-1 text-center sm:text-left'>
          <div className='text-2xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 font-mono'>
            Inngest
          </div>
          <div className='text-xs text-muted-foreground font-medium'>
            Async Job Pipeline
          </div>
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
      "Query commits, file history, and branch differences using natural language vector search.",
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
    <section id='features' className='mx-auto max-w-5xl px-6 py-20'>
      <div className='mb-14 text-center sm:text-left space-y-2'>
        <Badge
          variant='outline'
          className='mb-3 rounded-full border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300'
        >
          Capabilities
        </Badge>
        <h2 className='text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl'>
          Engineered for modern developer teams.
        </h2>
        <p className='text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed'>
          Complete visibility across your repositories with natural language
          intelligence.
        </p>
      </div>

      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {features.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            className='group border border-border/80 bg-card p-2 rounded-3xl transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5'
          >
            <CardHeader className='pb-2'>
              <div className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white'>
                <Icon className='h-5 w-5' strokeWidth={2} />
              </div>
              <CardTitle className='text-lg font-bold leading-snug text-foreground'>
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs leading-relaxed text-muted-foreground font-normal'>
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id='how-it-works' className='mx-auto max-w-5xl px-6 py-16'>
      <div className='mb-12 text-center sm:text-left space-y-2'>
        <Badge
          variant='outline'
          className='mb-3 rounded-full border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-300'
        >
          Architecture
        </Badge>
        <h2 className='text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl'>
          How TalkToYourGitHub Works
        </h2>
        <p className='text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed'>
          Three seamless steps connecting your GitHub workflow to AI vector search.
        </p>
      </div>

      <div className='grid gap-6 sm:grid-cols-3'>
        <div className='p-6 rounded-3xl border border-border/80 bg-card/90 shadow-sm space-y-3 relative overflow-hidden'>
          <div className='text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400'>
            01 / CONNECT
          </div>
          <h3 className='text-base font-bold text-foreground'>GitHub OAuth 2.0</h3>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            Connect your GitHub account with read-only access for secure multi-tenant isolation via Corsair API.
          </p>
        </div>

        <div className='p-6 rounded-3xl border border-border/80 bg-card/90 shadow-sm space-y-3 relative overflow-hidden'>
          <div className='text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400'>
            02 / INDEX
          </div>
          <h3 className='text-base font-bold text-foreground'>Inngest Vector RAG</h3>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            LangChain character splitters generate vector embeddings stored in Pinecone and PostgreSQL.
          </p>
        </div>

        <div className='p-6 rounded-3xl border border-border/80 bg-card/90 shadow-sm space-y-3 relative overflow-hidden'>
          <div className='text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400'>
            03 / CHAT
          </div>
          <h3 className='text-base font-bold text-foreground'>AI Intelligence</h3>
          <p className='text-xs text-muted-foreground leading-relaxed'>
            Ask questions, review PRs, triage issues, and inspect repository files in natural language.
          </p>
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <section className='mx-auto max-w-5xl px-6 py-16'>
      <div className='rounded-3xl border border-indigo-200/60 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/50 via-background to-violet-50/50 dark:from-indigo-950/30 dark:to-violet-950/20 p-8 sm:p-12 shadow-xl shadow-indigo-500/5 transition-all duration-300 hover:border-indigo-500/30'>
        <div className='grid gap-8 sm:grid-cols-2 sm:items-center'>
          <div className='space-y-3 text-left'>
            <Badge
              variant='outline'
              className='rounded-full border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/70 dark:bg-indigo-950/40 text-xs font-bold text-indigo-700 dark:text-indigo-300 tracking-wider'
            >
              Instant Access
            </Badge>
            <h2 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
              Ready to talk to your repositories?
            </h2>
            <p className='max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed'>
              Connect your GitHub account in less than a minute. Works
              seamlessly with private and public repos.
            </p>
          </div>
          <div className='flex flex-col sm:flex-row gap-3 sm:justify-end'>
            {session?.user ? (
              <Button
                size='lg'
                className='w-full sm:w-auto rounded-full px-7 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-transform active:scale-95'
                asChild
              >
                <Link
                  href='/dashboard'
                  className='flex items-center justify-center gap-2'
                >
                  Go to Dashboard
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            ) : (
              <Button
                size='lg'
                className='w-full sm:w-auto rounded-full px-7 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-transform active:scale-95'
                asChild
              >
                <Link
                  href='/sign-in'
                  className='flex items-center justify-center gap-2'
                >
                  Connect GitHub Repository
                  <ArrowRight className='h-4 w-4' />
                </Link>
              </Button>
            )}
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
          <div className='flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold'>
            T
          </div>
          <span className='text-xs text-muted-foreground font-semibold'>
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
              className='text-xs font-semibold text-muted-foreground transition-colors hover:text-indigo-600'
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
        <StatsBand />
        <Features />
        <HowItWorks />
        <CtaBand />
        <Footer />
      </div>
    </div>
  );
}
