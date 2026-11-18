import { ArrowRight } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Section, SectionHeading } from "./section";

const STEPS = [
  {
    title: "Connect GitHub",
    body: "One click with GitHub OAuth. No passwords, no extra accounts, revocable any time from your GitHub settings.",
  },
  {
    title: "Pick a repository",
    body: "Search and filter every repository you can access. Selecting one focuses the conversation on it.",
  },
  {
    title: "Ask anything",
    body: "The assistant calls only the GitHub tools it needs and answers with facts and links you can verify.",
  },
];

export function Workflow() {
  return (
    <Section id='workflow'>
      <SectionHeading
        eyebrow='How it works'
        title='From sign-in to first answer in under a minute'
      />
      <RevealGroup as='ol' stagger={0.12} className='grid gap-6 md:grid-cols-3'>
        {STEPS.map((step, i) => (
          <RevealItem as='li' key={step.title} className='h-full'>
            <div className='card-lift group relative h-full overflow-hidden rounded-xl bg-card p-7 shadow-card'>
              <span className='absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-500 ease-out group-hover:scale-x-100' />
              <span
                aria-hidden='true'
                className='pointer-events-none absolute right-5 -top-3 select-none text-[6.5rem] font-bold leading-none tracking-tighter text-foreground/[0.04] transition-colors duration-300 group-hover:text-brand/10'
              >
                {i + 1}
              </span>

              <span className='relative flex size-10 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-brand-foreground shadow-[0_6px_16px_-6px_var(--brand)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110'>
                {i + 1}
              </span>
              <h3 className='relative mt-6 text-lg font-semibold tracking-tight transition-colors group-hover:text-brand'>
                {step.title}
              </h3>
              <p className='relative mt-2 text-[15px] leading-relaxed text-muted-foreground'>
                {step.body}
              </p>
              <span className='relative mt-5 flex items-center gap-1.5 text-sm font-medium text-brand opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-2'>
                Step {String(i + 1).padStart(2, "0")}
                <ArrowRight className='size-3.5' />
              </span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
