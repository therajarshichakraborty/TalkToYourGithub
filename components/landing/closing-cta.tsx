import { PrimaryCta } from "./primary-cta";

export function ClosingCta({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <section className='mx-auto w-full max-w-6xl px-6 pb-24'>
      <div className='relative overflow-hidden rounded-3xl border bg-card px-6 py-20 text-center md:py-28'>
        <div className='bg-dots mask-radial pointer-events-none absolute inset-0' />
        <div className='pointer-events-none absolute inset-x-0 -bottom-40 mx-auto h-80 w-175 rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent)] opacity-20' />
        <div className='relative flex flex-col items-center'>
          <h2 className='text-gradient text-balance max-w-2xl text-4xl font-semibold tracking-tighter md:text-6xl'>
            Your repositories have answers.
          </h2>
          <p className='mt-5 max-w-md text-balance text-muted-foreground'>
            Connect GitHub and ask your first question in less than a minute.
          </p>
          <div className='mt-10'>
            <PrimaryCta isSignedIn={isSignedIn} />
          </div>
        </div>
      </div>
    </section>
  );
}
