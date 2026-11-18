import { PrimaryCta } from "./primary-cta";
import { Reveal } from "@/components/motion/reveal";
import { MountainBackdrop } from "./mountain-backdrop";

export function ClosingCta({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className='dotted-t px-6 py-20 md:px-14 md:py-24'>
      <Reveal className='relative overflow-hidden rounded-2xl px-6 py-20 text-center shadow-card md:py-24'>
        <MountainBackdrop className='h-full' />
        <div className='relative flex flex-col items-center'>
          <h2 className='max-w-2xl text-balance text-4xl font-bold leading-[1.25] tracking-[-0.03em] md:text-5xl'>
            Your repositories <span className='highlight'>have answers</span>
          </h2>
          <p className='mt-5 max-w-md text-balance text-lg text-foreground/70'>
            Connect GitHub and ask your first question in less than a minute.
          </p>
          <div className='mt-10'>
            <PrimaryCta isSignedIn={isSignedIn} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
