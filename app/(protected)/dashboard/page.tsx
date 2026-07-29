/*
 * Page: /dashboard
 * Description: Minimal UI shell for Day 16 of TalkToYourGithub.
 * Integrates shadcn Sidebar, repository list selection, and interactive AI chat using useChat().
 */

"use client";

import React, { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { RepositoryItem } from "@/components/sidebar/repo-list";
import { ChatUI } from "@/components/chat/chat-ui";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FolderGit2, MessageSquare, Sparkles } from "lucide-react";

export default function DashboardPage() {
  /* Active repository state selected from sidebar */
  const [selectedRepo, setSelectedRepo] = useState<RepositoryItem | null>(null);

  /* Retrieve current authenticated user session */
  const { data: session } = authClient.useSession();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        {/* Navigation Sidebar housing Repository list */}
        <AppSidebar
          selectedRepo={selectedRepo}
          onSelectRepo={setSelectedRepo}
          user={session?.user}
        />

        {/* Main Interface Content Area */}
        <SidebarInset className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
          {/* Top Control Bar */}
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />
              <div className="flex items-center gap-2 text-xs font-medium">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Chat Workspace</span>
                {selectedRepo ? (
                  <Badge variant="outline" className="text-[11px] font-mono gap-1">
                    <FolderGit2 className="h-3 w-3 text-primary" />
                    {selectedRepo.fullName}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                    All Repositories
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline flex items-center gap-1 text-[11px]">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Wired with AI SDK useChat()
              </span>
            </div>
          </header>

          {/* Main AI Chat Interface Pane */}
          <main className="flex-1 h-[calc(100vh-3rem)] overflow-hidden">
            <ChatUI activeRepo={selectedRepo} />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
