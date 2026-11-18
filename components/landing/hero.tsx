import {
  CircleDot,
  FolderGit2,
  GitCommitHorizontal,
  GitPullRequest,
} from "lucide-react";
import Link from "next/link";
import { Entrance } from "@/components/motion/entrance";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { PrimaryCta } from "./primary-cta";
import { MountainBackdrop } from "./mountain-backdrop";

const CAPABILITIES = [
  { icon: FolderGit2, title: "Repositories", detail: "Every one you own" },
  { icon: GitPullRequest, title: "Pull requests", detail: "Reviewed by AI" },
  { icon: CircleDot, title: "Issues", detail: "Drafted & triaged" },
  { icon: GitCommitHorizontal, title: "Commits", detail: "Explained simply" },
];

export function Hero({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className='relative -mt-23 overflow-hidden px-6 pb-20 pt-48 md:pb-24 md:pt-56'>
      <MountainBackdrop priority className='h-140' />

      <div className='relative mx-auto flex max-w-3xl flex-col items-center text-center'>
        <Entrance>
          <h1 className='text-balance text-[2.6rem] font-bold leading-[1.16] tracking-[-0.035em] text-foreground md:text-[4rem]'>
            Ask your GitHub anything.
            <br />
            <span className='highlight'>Get answers</span> in seconds.
          </h1>
        </Entrance>

        <Entrance delay={150}>
          <p className='mt-7 max-w-xl text-pretty text-lg leading-relaxed text-foreground/70'>
            Talk to your GitHub reads your repositories, commits, pull requests
            and issues, then answers in plain English with facts you can verify.
          </p>
        </Entrance>

        <Entrance
          delay={300}
          className='mt-10 flex flex-col items-center gap-3 sm:flex-row'
        >
          <PrimaryCta isSignedIn={isSignedIn} />
          <Link href='#product' className='btn-plain h-12 px-5 text-base'>
            See it in action
          </Link>
        </Entrance>
      </div>

      <div className='relative mx-auto mt-24 max-w-4xl text-center'>
        <p className='text-[15px] font-medium leading-snug text-foreground'>
          Everything your repositories
          <br />
          already know
        </p>
        <RevealGroup
          as='ul'
          className='mt-7 grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4'
        >
          {CAPABILITIES.map(({ icon: Icon, title, detail }) => (
            <RevealItem
              as='li'
              key={title}
              className='group flex cursor-default items-center justify-center gap-3 md:justify-start'
            >
              <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-card shadow-card transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-brand group-hover:text-brand-foreground'>
                <Icon className='size-4.5' />
              </span>
              <span className='text-left leading-tight'>
                <span className='block text-[15px] font-medium'>{title}</span>
                <span className='block text-sm text-muted-foreground'>
                  {detail}
                </span>
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
