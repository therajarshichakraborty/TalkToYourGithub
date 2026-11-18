import { CountUp } from "@/components/motion/count-up";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "./section";

const METRICS = [
  { value: "~200", unit: "tokens", label: "System prompt" },
  { value: "8", unit: "messages", label: "Context window" },
  { value: "6k", unit: "chars", label: "Max file read" },
  { value: "700", unit: "tokens", label: "Reply cap" },
];

export function Efficiency() {
  return (
    <Section id='efficiency'>
      <SectionHeading
        eyebrow='Efficiency'
        title='Small prompts. Sharp answers.'
        description='Every request is engineered to spend as few tokens as possible, so replies come back fast and stay focused.'
      />
      <RevealGroup
        as='dl'
        className='grid grid-cols-2 *:border-dotted *:border-dot lg:grid-cols-4'
      >
        {METRICS.map((m, i) => (
          <RevealItem
            key={m.label}
            className={cn(
              "group flex flex-col-reverse items-center gap-1 px-4 py-6 text-center",
              i % 2 === 0 && "border-r-2",
              i < 2 && "border-b-2 lg:border-b-0",
              i < METRICS.length - 1 && "lg:border-r-2",
            )}
          >
            <dt className='text-sm font-medium text-foreground/70'>
              {m.label}
            </dt>
            <dd className='flex items-baseline gap-1.5'>
              <CountUp
                value={m.value}
                className='text-4xl font-bold tabular-nums tracking-tight transition-colors duration-300 group-hover:text-brand md:text-5xl'
              />
              <span className='text-sm text-muted-foreground'>{m.unit}</span>
            </dd>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
