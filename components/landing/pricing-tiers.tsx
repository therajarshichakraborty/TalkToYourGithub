import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  audience: string;
  features: string[];
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    audience: "For individual developers exploring their own repositories.",
    features: [
      "All personal repositories",
      "Chat with commits, PRs and issues",
      "AI repository summaries",
      "Issue drafts you file in one click",
    ],
  },
  {
    name: "Pro",
    audience: "For developers who live in their repositories every day.",
    featured: true,
    features: [
      "Everything in Starter",
      "Organization and collaborator repositories",
      "AI pull request reviews",
      "Semantic project memory search",
      "Priority background syncs",
    ],
  },
  {
    name: "Team",
    audience: "For teams who want shared insight across many repositories.",
    features: [
      "Everything in Pro",
      "Shared team workspaces",
      "Activity insights across repositories",
      "Admin controls and access management",
      "Priority support",
    ],
  },
];

function TierCard({ tier, isSignedIn }: { tier: Tier; isSignedIn: boolean }) {
  const isStarter = tier.name === "Starter";

  return (
    <div
      className={cn(
        "card-lift group relative flex h-full flex-col rounded-2xl bg-card p-8 shadow-card",
        tier.featured && "ring-2 ring-brand",
      )}
    >
      {tier.featured && (
        <span className='absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground shadow-[0_6px_16px_-6px_var(--brand)]'>
          <Sparkles className='size-3' />
          Most popular
        </span>
      )}

      <h3 className='text-xl font-semibold tracking-tight transition-colors group-hover:text-brand'>
        {tier.name}
      </h3>
      <p className='mt-2 min-h-12 text-[15px] leading-relaxed text-muted-foreground'>
        {tier.audience}
      </p>

      <div className='mt-7 flex items-center gap-3'>
        <span className='text-3xl font-bold tracking-tight'>Coming soon</span>
        <span className='relative flex size-2.5'>
          <span className='absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60' />
          <span className='relative inline-flex size-2.5 rounded-full bg-brand' />
        </span>
      </div>
      <p className='mt-1 text-sm text-muted-foreground'>
        Pricing will be announced soon
      </p>

      <div className='dotted-t my-7' />

      <ul className='flex-1 space-y-3'>
        {tier.features.map((feature) => (
          <li key={feature} className='flex items-start gap-3 text-[15px]'>
            <span className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-foreground'>
              <Check className='size-3 text-brand transition-colors group-hover:text-brand-foreground' />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {isStarter ? (
        <Link
          href={isSignedIn ? "/dashboard" : "/sign-in"}
          className='btn-brand mt-8 h-11 w-full text-[15px]'
        >
          {isSignedIn ? "Open dashboard" : "Use it free today"}
        </Link>
      ) : (
        <button
          type='button'
          disabled
          className='btn-plain mt-8 h-11 w-full cursor-not-allowed text-[15px] text-muted-foreground hover:translate-y-0 hover:bg-card'
        >
          Coming soon
        </button>
      )}
    </div>
  );
}

export function PricingTiers({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <RevealGroup stagger={0.12} className='grid gap-6 pt-3 lg:grid-cols-3'>
      {TIERS.map((tier) => (
        <RevealItem key={tier.name} className='h-full'>
          <TierCard tier={tier} isSignedIn={isSignedIn} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
