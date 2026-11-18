import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("relative mx-auto w-full max-w-6xl px-6 py-24 md:py-32", className)}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "mb-14 flex max-w-2xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
      )}
    >
      <span className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground'>
        {eyebrow}
      </span>
      <h2 className='text-balance text-3xl font-semibold tracking-tight md:text-5xl'>
        {title}
      </h2>
      {description && (
        <p className='text-balance text-base leading-relaxed text-muted-foreground md:text-lg'>
          {description}
        </p>
      )}
    </div>
  );
}
