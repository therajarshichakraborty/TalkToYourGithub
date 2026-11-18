import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { GithubIcon } from "@/components/brand/github-icon";
import { Button } from "@/components/ui/button";
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
  return (
    <Button
      asChild
      className={cn(
        "group shadow-button rounded-full font-medium",
        size === "lg" ? "h-11 px-6 text-sm" : "h-8 px-4 text-xs",
        className,
      )}
    >
      <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>
        {isSignedIn ? (
          "Open dashboard"
        ) : (
          <>
            <GithubIcon className='size-4' />
            Continue with GitHub
          </>
        )}
        <ArrowRight className='size-3.5 transition-transform group-hover:translate-x-0.5' />
      </Link>
    </Button>
  );
}
