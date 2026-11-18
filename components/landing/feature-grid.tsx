import {
  FileSearch,
  FolderGit2,
  GitPullRequest,
  MessageSquareText,
  ShieldCheck,
  SquarePen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "./section";

function Cell({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/20",
        className,
      )}
    >
      <div className='relative flex-1'>{children}</div>
      <div className='relative mt-6'>
        <Icon className='mb-3 size-5 text-muted-foreground transition-colors group-hover:text-foreground' />
        <h3 className='text-base font-semibold tracking-tight'>{title}</h3>
        <p className='mt-1.5 text-sm leading-relaxed text-muted-foreground'>
          {description}
        </p>
      </div>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className='space-y-2 text-xs'>
      <div className='ml-auto w-fit max-w-[80%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground'>
        How is auth handled in web-dashboard?
      </div>
      <div className='w-fit max-w-[90%] rounded-xl rounded-bl-sm border bg-background px-3 py-2 text-muted-foreground'>
        It uses <span className='font-mono text-foreground'>better-auth</span>{" "}
        with GitHub OAuth. Sessions are checked in{" "}
        <span className='font-mono text-foreground'>proxy.ts</span> before any
        protected route renders.
      </div>
    </div>
  );
}

function RepoVisual() {
  const bars = [92, 74, 63, 48, 35, 22];
  return (
    <div className='space-y-2'>
      {bars.map((w, i) => (
        <div key={i} className='flex items-center gap-2'>
          <span className='size-1.5 rounded-full bg-foreground/30' />
          <span
            className='h-2 rounded-full bg-foreground/10 transition-all duration-500 group-hover:bg-foreground/20'
            style={{ width: `${w}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function DiffVisual() {
  return (
    <div className='overflow-hidden rounded-lg border bg-background font-mono text-[11px] leading-5'>
      <div className='bg-destructive/10 px-3 text-destructive'>- const id = req.query.id</div>
      <div className='bg-success/10 px-3 text-success'>+ const id = parseId(req.query.id)</div>
      <div className='px-3 text-muted-foreground'>  return db.find(id)</div>
    </div>
  );
}

export function FeatureGrid() {
  return (
    <Section id='features'>
      <SectionHeading
        eyebrow='Product'
        title='One conversation for every repository you own.'
        description='Talk to your GitHub reads the same data you would, through your own GitHub token, and answers with exact numbers, names and links.'
      />
      <div className='grid auto-rows-[minmax(260px,auto)] grid-cols-1 gap-4 md:grid-cols-6'>
        <Cell
          icon={MessageSquareText}
          title='Ask in plain language'
          description='No query syntax. Ask the way you would ask a teammate and get a direct answer first.'
          className='md:col-span-4'
        >
          <ChatVisual />
        </Cell>
        <Cell
          icon={FolderGit2}
          title='Every repository'
          description='Personal, collaborator and organization repos, all paginated. Nothing silently capped.'
          className='md:col-span-2'
        >
          <RepoVisual />
        </Cell>
        <Cell
          icon={GitPullRequest}
          title='Pull request reviews'
          description='Structured reviews that flag bugs, security risks and concrete next steps.'
          className='md:col-span-2'
        >
          <DiffVisual />
        </Cell>
        <Cell
          icon={FileSearch}
          title='Reads real code'
          description='Browses directories and files on any branch before it describes your stack, so it never invents a file.'
          className='md:col-span-2'
        />
        <Cell
          icon={SquarePen}
          title='Drafts issues, you decide'
          description='It writes the title and body. You review the draft and file it with one click.'
          className='md:col-span-2'
        />
        <Cell
          icon={ShieldCheck}
          title='Scoped to you'
          description='Requests run with your own OAuth token. Each account is isolated, and tool output is treated as data, never as instructions.'
          className='md:col-span-6 md:min-h-0'
        />
      </div>
    </Section>
  );
}
