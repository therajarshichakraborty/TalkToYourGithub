import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { GithubIcon } from "@/components/brand/github-icon";
import { cn } from "@/lib/utils";

export function PrimaryCta({
  isSignedIn,
  size = "lg",
  className,
}: {
  isSignedIn: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  const large = size === "lg";

  return (
    <Link
      href={isSignedIn ? "/dashboard" : "/sign-in"}
      className={cn(
        "btn-brand group",
        large ? "h-12 pl-5 pr-1.5 text-base" : "h-10 px-4 text-[15px]",
        className,
      )}
    >
      {isSignedIn
        ? "Open dashboard"
        : large
          ? "Continue with GitHub"
          : "Sign in"}
      {large ? (
        <span className='flex size-9 items-center justify-center rounded-md bg-white text-brand shadow-sm'>
          {isSignedIn ? (
            <ArrowRight className='size-4 transition-transform group-hover:translate-x-0.5' />
          ) : (
            <GithubIcon className='size-4.5 text-neutral-900' />
          )}
        </span>
      ) : null}
    </Link>
  );
}
