import { Skeleton } from "@/components/ui/skeleton";

export function StatTile({
  label,
  value,
  detail,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading?: boolean;
}) {
  return (
    <div className='group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card'>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-muted-foreground'>{label}</span>
        <span className='flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-300 group-hover:bg-brand group-hover:text-brand-foreground'>
          <Icon className='size-4' />
        </span>
      </div>
      {isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-3.5 w-28' />
        </div>
      ) : (
        <div className='space-y-1'>
          <p className='text-3xl font-semibold tabular-nums tracking-tight'>
            {value}
          </p>
          {detail && <p className='text-xs text-muted-foreground'>{detail}</p>}
        </div>
      )}
    </div>
  );
}
