/*
 * Component: AppSidebar
 * Description: Main navigation sidebar housing the repository list, brand header,
 * and user account options using shadcn/ui sidebar primitives.
 */

"use client";

import React from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { RepoList, RepositoryItem } from "./repo-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FolderGit2, MessageSquare, LogOut, Sparkles, Bot } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

/*
 * SVG GitHub Icon component to replace missing lucide-react icon
 */
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      width='24'
      height='24'
      stroke='currentColor'
      strokeWidth='2'
      fill='none'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...props}
    >
      <path d='M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' />
      <path d='M9 18c-4.51 2-5-2-7-2' />
    </svg>
  );
}

interface AppSidebarProps {
  selectedRepo: RepositoryItem | null;
  onSelectRepo: (repo: RepositoryItem | null) => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function AppSidebar({
  selectedRepo,
  onSelectRepo,
  user,
}: AppSidebarProps) {
  const router = useRouter();

  /*
   * Handle user sign out action via authClient
   */
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  /* Get user initials for avatar fallback */
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "GH";

  return (
    <Sidebar className='border-r border-sidebar-border bg-sidebar'>
      {/* Brand & App Header */}
      <SidebarHeader className='border-b border-sidebar-border px-4 py-3'>
        <div className='flex items-center gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 shrink-0'>
            <GithubIcon className='h-5 w-5' />
          </div>
          <div className='flex flex-col'>
            <span className='font-semibold text-sm leading-none flex items-center gap-1.5'>
              TalkToYourGitHub
              <Sparkles className='h-3 w-3 text-indigo-500' />
            </span>
            <span className='text-[11px] text-muted-foreground mt-0.5'>
              AI Code Assistant
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Main Sidebar Content: Repository Navigation */}
      <SidebarContent>
        <RepoList selectedRepo={selectedRepo} onSelectRepo={onSelectRepo} />
      </SidebarContent>

      {/* User Profile & Footer Actions */}
      <SidebarFooter className='border-t border-sidebar-border p-3'>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className='flex items-center justify-between gap-2 p-1.5 rounded-lg bg-sidebar-accent/40'>
              <div className='flex items-center gap-2 min-w-0'>
                <Avatar className='h-8 w-8 rounded-md border border-sidebar-border'>
                  <AvatarImage
                    src={user?.image || ""}
                    alt={user?.name || "User"}
                  />
                  <AvatarFallback className='text-xs font-medium rounded-md'>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className='flex flex-col truncate'>
                  <span className='text-xs font-medium truncate'>
                    {user?.name || "Connected User"}
                  </span>
                  <span className='text-[10px] text-muted-foreground truncate'>
                    {user?.email || "GitHub Account"}
                  </span>
                </div>
              </div>
              <SidebarMenuButton
                onClick={handleSignOut}
                size='sm'
                className='h-8 w-8 p-0 justify-center text-muted-foreground hover:text-destructive'
                title='Sign out'
              >
                <LogOut className='h-4 w-4' />
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
