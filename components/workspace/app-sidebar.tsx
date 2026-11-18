"use client";

import { LayoutDashboard, LogOut, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { RepoList } from "./repo-list";
import { useWorkspace } from "./workspace-provider";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/chat", label: "Assistant", icon: MessageSquareText },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useWorkspace();

  const signOut = async () => {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <Sidebar variant='inset'>
      <SidebarHeader className='h-14 justify-center px-3'>
        <Logo href='/dashboard' />
      </SidebarHeader>

      <SidebarContent className='overflow-hidden'>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={pathname === href}>
                    <Link href={href}>
                      <Icon />
                      {label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className='mx-0' />
        <RepoList />
      </SidebarContent>

      <SidebarFooter>
        <div className='flex items-center gap-2.5 rounded-lg p-1.5'>
          <Avatar className='size-8 rounded-md'>
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback className='rounded-md text-xs'>
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1 leading-tight'>
            <p className='truncate text-sm font-medium'>{user.name}</p>
            <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
          </div>
          <button
            type='button'
            onClick={signOut}
            title='Sign out'
            aria-label='Sign out'
            className='inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground'
          >
            <LogOut className='size-4' />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
