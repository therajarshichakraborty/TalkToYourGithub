import {
  FileSearch,
  FolderGit2,
  GitPullRequest,
  MessageSquareText,
  ShieldCheck,
  SquarePen,
} from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "./section";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Ask in plain language",
    body: "No query syntax. Ask the way you would ask a teammate and get the answer first, details after.",
  },
  {
    icon: FolderGit2,
    title: "Every repository",
    body: "Personal, collaborator and organization repositories, fully paginated. Search, filter and sort all of them.",
  },
  {
    icon: GitPullRequest,
    title: "Pull request reviews",
    body: "Structured reviews that point out bugs, security risks and concrete next steps, file by file.",
  },
  {
    icon: FileSearch,
    title: "Reads the real code",
    body: "Browses folders and files on any branch before describing your stack, so it never invents a file.",
  },
  {
    icon: SquarePen,
    title: "Drafts issues, you decide",
    body: "It writes the title and body. You review the draft and file it with a single click.",
  },
  {
    icon: ShieldCheck,
    title: "Scoped to your account",
    body: "Every request runs with your own GitHub token. Accounts are isolated and nothing is shared.",
  },
];

function cellBorders(index: number, total: number) {
  return cn(
    index < total - 1 && "border-b-2",
    index < total - 2 ? "sm:border-b-2" : "sm:border-b-0",
    index % 2 === 0 ? "sm:border-r-2" : "sm:border-r-0",
    index < total - 3 ? "lg:border-b-2" : "lg:border-b-0",
    index % 3 !== 2 ? "lg:border-r-2" : "lg:border-r-0",
  );
}

export function FeatureGrid() {
  return (
    <Section id='features'>
      <SectionHeading
        eyebrow='Features'
        title='Built for the questions developers actually ask'
      />
      <RevealGroup className='grid sm:grid-cols-2 lg:grid-cols-3 *:border-dotted *:border-dot'>
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <RevealItem key={title} className={cellBorders(i, FEATURES.length)}>
            <div className='group relative flex h-full flex-col gap-4 p-8 transition-colors duration-300 hover:bg-brand/[0.035]'>
              <span className='flex size-10 items-center justify-center rounded-lg bg-card shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:rotate-3 group-hover:bg-brand group-hover:text-brand-foreground'>
                <Icon className='size-4.5' />
              </span>
              <h3 className='text-lg font-semibold tracking-tight transition-colors group-hover:text-brand'>
                {title}
              </h3>
              <p className='text-[15px] leading-relaxed text-muted-foreground'>
                {body}
              </p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
