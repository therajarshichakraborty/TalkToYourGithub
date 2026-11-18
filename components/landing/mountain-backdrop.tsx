import Image from "next/image";
import mountain from "@/public/mountain.webp";
import { cn } from "@/lib/utils";

export function MountainBackdrop({
  priority = false,
  className,
}: {
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 overflow-hidden",
        className,
      )}
    >
      <Image
        src={mountain}
        alt=''
        fill
        priority={priority}
        placeholder='blur'
        sizes='(min-width: 1152px) 1152px, 100vw'
        className='object-cover object-[50%_18%] dark:brightness-[0.55] dark:saturate-[0.8]'
      />
      <div className='absolute inset-0 bg-linear-to-b from-background/10 via-background/55 via-45% to-background to-80%' />
    </div>
  );
}
