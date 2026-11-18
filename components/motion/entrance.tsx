import { cn } from "@/lib/utils";

const DELAYS = {
  0: "delay-0",
  150: "delay-150",
  300: "delay-300",
} as const;

export function Entrance({
  delay = 0,
  className,
  children,
}: {
  delay?: keyof typeof DELAYS;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in blur-in-sm slide-in-from-bottom-3 fill-mode-both duration-700",
        DELAYS[delay],
        className,
      )}
    >
      {children}
    </div>
  );
}
