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
    <div className='flex flex-col gap-4 rounded-xl border bg-card p-5'>
      <div className='flex items-center justify-between'>
        <span className='text-sm text-muted-foreground'>{label}</span>
        <Icon className='size-4 text-muted-foreground' />
      </div>
      {isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-3.5 w-28' />
        </div>
      ) : (
        <div className='space-y-1'>
          <p className='text-3xl font-semibold tabular-nums tracking-tight'>{value}</p>
          {detail && <p className='text-xs text-muted-foreground'>{detail}</p>}
        </div>
      )}
    </div>
  );
}
