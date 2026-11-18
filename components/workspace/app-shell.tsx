import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
  title,
  actions,
  children,
  contentClassName,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <SidebarProvider className='h-svh'>
      <AppSidebar />
      <SidebarInset className='min-h-0 overflow-hidden'>
        <header className='flex h-14 shrink-0 items-center gap-3 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='h-4!' />
          <div className='min-w-0 flex-1 truncate text-sm font-medium'>{title}</div>
          <div className='flex items-center gap-1.5'>
            {actions}
            <ThemeToggle />
          </div>
        </header>
        <div className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
