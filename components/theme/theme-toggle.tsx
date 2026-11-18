"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <AnimatedThemeToggler
      theme={mounted && resolvedTheme === "light" ? "light" : "dark"}
      onThemeChange={setTheme}
      aria-label='Toggle theme'
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4",
        className,
      )}
    />
  );
}
