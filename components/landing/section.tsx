import { Reveal } from "@/components/motion/reveal";
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
      className={cn(
        "dotted-t scroll-mt-28 px-6 py-20 md:px-14 md:py-28",
        className,
      )}
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
    <Reveal
      className={cn(
        "mb-14 flex max-w-2xl flex-col gap-4",
        align === "center" && "mx-auto items-center text-center",
      )}
    >
      <span className='inline-flex items-center gap-2 text-sm font-medium text-brand'>
        <span className='size-1.5 rounded-full bg-brand' />
        {eyebrow}
      </span>
      <h2 className='text-balance text-3xl font-semibold tracking-tight md:text-[2.75rem] md:leading-[1.1]'>
        {title}
      </h2>
      {description && (
        <p className='text-balance text-base leading-relaxed text-muted-foreground md:text-lg'>
          {description}
        </p>
      )}
    </Reveal>
  );
}
