import { Section, SectionHeading } from "./section";

const METRICS = [
  {
    value: "~200",
    unit: "tokens",
    label: "System prompt",
    body: "A tight instruction set instead of pages of boilerplate on every message.",
  },
  {
    value: "8",
    unit: "messages",
    label: "Context window",
    body: "Only the recent conversation is sent. Older turns stay in your history, not your bill.",
  },
  {
    value: "6k",
    unit: "chars max",
    label: "File reads",
    body: "Files are trimmed and API payloads reduced to the fields an answer needs.",
  },
  {
    value: "700",
    unit: "tokens cap",
    label: "Replies",
    body: "Answers lead with the result and stay short unless you ask for depth.",
  },
];

export function Efficiency() {
  return (
    <Section id='efficiency' className='border-t'>
      <SectionHeading
        eyebrow='Efficiency'
        title='Small prompts. Sharp answers.'
        description='Every request is engineered to spend as few tokens as possible, so responses come back fast and stay focused.'
      />
      <div className='grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4'>
        {METRICS.map((m) => (
          <div key={m.label} className='flex flex-col gap-3 bg-card p-7'>
            <span className='font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>
              {m.label}
            </span>
            <div className='flex items-baseline gap-1.5'>
              <span className='text-4xl font-semibold tracking-tight'>{m.value}</span>
              <span className='text-sm text-muted-foreground'>{m.unit}</span>
            </div>
            <p className='text-sm leading-relaxed text-muted-foreground'>{m.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
