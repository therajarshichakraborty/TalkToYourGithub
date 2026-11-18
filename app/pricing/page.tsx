import { Gift } from "lucide-react";
import type { Metadata } from "next";
import { ClosingCta } from "@/components/landing/closing-cta";
import { LandingShell } from "@/components/landing/landing-shell";
import { MountainBackdrop } from "@/components/landing/mountain-backdrop";
import { PricingTiers } from "@/components/landing/pricing-tiers";
import { Section, SectionHeading } from "@/components/landing/section";
import { Entrance } from "@/components/motion/entrance";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { getServerSession } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Starter, Pro and Team plans for Talk to your GitHub are coming soon. It is free to use until then.",
};

const PRICING_FAQS = [
  {
    q: "Is it free right now?",
    a: "Yes. Every feature is free to use while we finalize pricing. You will be told well before anything changes.",
  },
  {
    q: "Will my data carry over to a paid plan?",
    a: "Yes. Your conversations, summaries and settings stay with your account whichever plan you choose.",
  },
  {
    q: "When will pricing be announced?",
    a: "Soon. Plans will be published here first, and nothing will be charged without your explicit consent.",
  },
];

export default async function PricingPage() {
  const session = await getServerSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <LandingShell isSignedIn={isSignedIn}>
      <section className='relative -mt-23 overflow-hidden px-6 pb-16 pt-48 md:px-14 md:pt-52'>
        <MountainBackdrop priority className='h-140' />
        <div className='relative mx-auto flex max-w-3xl flex-col items-center text-center'>
          <Entrance>
            <span className='inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-sm font-medium text-brand shadow-card backdrop-blur'>
              <span className='size-1.5 rounded-full bg-brand' />
              Pricing
            </span>
          </Entrance>
          <Entrance delay={150}>
            <h1 className='mt-6 text-balance text-[2.6rem] font-bold leading-[1.16] tracking-[-0.035em] md:text-[3.75rem]'>
              Simple plans, <span className='highlight'>coming soon</span>
            </h1>
          </Entrance>
          <Entrance delay={300}>
            <p className='mt-6 max-w-xl text-pretty text-lg leading-relaxed text-foreground/70'>
              Three plans for individuals, power users and teams. Until they
              launch, every feature is free to use.
            </p>
          </Entrance>
        </div>

        <div className='relative mx-auto mt-16 max-w-5xl'>
          <PricingTiers isSignedIn={isSignedIn} />
          <Entrance delay={300} className='mt-10 flex justify-center'>
            <p className='inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm font-medium text-brand'>
              <Gift className='size-4' />
              Free for everyone until pricing launches
            </p>
          </Entrance>
        </div>
      </section>

      <Section id='pricing-faq'>
        <SectionHeading eyebrow='Questions' title='About pricing' />
        <RevealGroup className='mx-auto grid max-w-5xl gap-6 md:grid-cols-3'>
          {PRICING_FAQS.map((item) => (
            <RevealItem key={item.q} className='h-full'>
              <div className='card-lift h-full rounded-xl bg-card p-7 shadow-card'>
                <h3 className='text-lg font-semibold tracking-tight'>
                  {item.q}
                </h3>
                <p className='mt-2 text-[15px] leading-relaxed text-muted-foreground'>
                  {item.a}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <ClosingCta isSignedIn={isSignedIn} />
    </LandingShell>
  );
}
