import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-7 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground shadow-button",
        className,
      )}
      aria-hidden='true'
    >
      <svg viewBox='0 0 24 24' className='size-4' fill='none'>
        <path
          d='M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 4v-4h0A2 2 0 0 1 5 13Z'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinejoin='round'
        />
        <circle cx='9.5' cy='9.5' r='1.1' fill='currentColor' />
        <circle cx='14.5' cy='9.5' r='1.1' fill='currentColor' />
        <path
          d='M9.5 10.6v.4a2.5 2.5 0 0 0 2.5 2.5h0a2.5 2.5 0 0 0 2.5-2.5v-.4'
          stroke='currentColor'
          strokeWidth='1.4'
          strokeLinecap='round'
        />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 text-base font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark />
      <span>
        Talk to your <span className='text-muted-foreground'>GitHub</span>
      </span>
    </Link>
  );
}
