import { Section, SectionHeading } from "./section";

const STEPS = [
  {
    title: "Connect GitHub",
    body: "One click with GitHub OAuth. No passwords, no extra accounts, revocable from your GitHub settings at any time.",
  },
  {
    title: "Pick a repository",
    body: "Search and filter every repository you have access to. Selecting one scopes the conversation to it.",
  },
  {
    title: "Ask anything",
    body: "The assistant calls only the GitHub tools it needs, then answers with exact facts and links you can verify.",
  },
];

export function Workflow() {
  return (
    <Section id='workflow' className='border-t'>
      <SectionHeading
        eyebrow='How it works'
        title='From sign-in to answer in under a minute.'
      />
      <ol className='relative grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3'>
        {STEPS.map((step, i) => (
          <li key={step.title} className='flex flex-col gap-4 bg-card p-8'>
            <span className='font-mono text-sm text-muted-foreground'>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className='text-xl font-semibold tracking-tight'>{step.title}</h3>
            <p className='text-sm leading-relaxed text-muted-foreground'>{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
