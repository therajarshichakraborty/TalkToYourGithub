import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PrimaryCta } from "./primary-cta";
import { ProductPreview } from "./product-preview";

export function Hero({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className='relative overflow-hidden'>
      <div className='bg-grid mask-radial pointer-events-none absolute inset-0 -top-16' />
      <div className='pointer-events-none absolute left-1/2 top-0 h-120 w-225 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent)] opacity-[0.12]' />

      <div className='relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-20 text-center md:pt-28'>
        <Link
          href='#workflow'
          className='group mb-8 inline-flex items-center gap-2 rounded-full border bg-background/60 py-1 pl-1 pr-3 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground'
        >
          <span className='rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground'>
            New
          </span>
          AI pull request reviews, built in
          <span className='transition-transform group-hover:translate-x-0.5'>→</span>
        </Link>

        <h1 className='text-gradient text-balance max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tighter md:text-7xl'>
          Talk to your GitHub like you talk to your team.
        </h1>

        <p className='text-balance mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg'>
          Ask about commits, pull requests, issues and code across every
          repository you own. Precise answers grounded in live GitHub data,
          never guesses.
        </p>

        <div className='mt-10 flex flex-col items-center gap-3 sm:flex-row'>
          <PrimaryCta isSignedIn={isSignedIn} />
          <Button
            asChild
            variant='ghost'
            className='h-11 rounded-full px-6 text-sm text-muted-foreground hover:text-foreground'
          >
            <Link href='#features'>Explore the product</Link>
          </Button>
        </div>

        <p className='mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80'>
          GitHub sign-in only · Your token, your data
        </p>

        <div className='mt-20 w-full'>
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
