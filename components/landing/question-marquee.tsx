const ROWS = [
  [
    "What changed on main this week?",
    "Which PRs are waiting on review?",
    "Summarize the architecture of this repo",
    "Who touched the auth middleware last?",
    "List stale branches older than a month",
    "Review PR #42 for security issues",
  ],
  [
    "Where is the rate limiter configured?",
    "Draft an issue for the flaky checkout test",
    "Which of my repos use Next.js?",
    "What does package.json depend on?",
    "Show open bugs labelled p1",
    "Why was the cache layer rewritten?",
  ],
];

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  return (
    <div className='mask-fade-x flex overflow-hidden'>
      <div
        className='flex w-max shrink-0 animate-marquee gap-3 pr-3 hover:[animation-play-state:paused]'
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {[...items, ...items].map((q, i) => (
          <span
            key={`${q}-${i}`}
            aria-hidden={i >= items.length}
            className='whitespace-nowrap rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground'
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}

export function QuestionMarquee() {
  return (
    <section aria-label='Example questions' className='border-y bg-muted/20 py-10'>
      <p className='mb-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground'>
        Questions people actually ask
      </p>
      <div className='flex flex-col gap-3'>
        <Row items={ROWS[0]} />
        <Row items={ROWS[1]} reverse />
      </div>
    </section>
  );
}
