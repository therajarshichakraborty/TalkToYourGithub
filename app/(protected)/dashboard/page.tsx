/*
 * Page: /dashboard
 * Description: Main protected dashboard layout for Day 17 of TalkToYourGithub.
 * Displays the Continue Working dashboard cards populated from activity_logs and repository_summaries,
 * alongside the interactive AI Chat Assistant view.
 */

"use client";

import React, { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { RepositoryItem } from "@/components/sidebar/repo-list";
import { ChatUI } from "@/components/chat/chat-ui";
import { ContinueWorkingCards } from "@/components/dashboard/continue-working-cards";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderGit2, MessageSquare, LayoutDashboard, Sparkles } from "lucide-react";

export default function DashboardPage() {
  /* Active repository state selected from sidebar or dashboard cards */
  const [selectedRepo, setSelectedRepo] = useState<RepositoryItem | null>(null);

  /* Active dashboard view mode: 'dashboard' or 'chat' */
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat">("dashboard");

  /* Retrieve current authenticated user session */
  const { data: session } = authClient.useSession();

  /*
   * Handle selecting a repository card from Continue Working dashboard to launch chat
   */
  const handleSelectRepoForChat = (repo: RepositoryItem) => {
    setSelectedRepo(repo);
    setActiveTab("chat");
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        {/* Navigation Sidebar housing Repository list */}
        <AppSidebar
          selectedRepo={selectedRepo}
          onSelectRepo={(repo) => {
            setSelectedRepo(repo);
            if (repo) setActiveTab("chat");
          }}
          user={session?.user}
        />

        {/* Main Interface Content Area */}
        <SidebarInset className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
          {/* Top Control Header */}
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-4" />

              {/* View Switcher Tabs */}
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as "dashboard" | "chat")}
                className="w-auto"
              >
                <TabsList className="h-8 p-0.5 bg-muted/60">
                  <TabsTrigger
                    value="dashboard"
                    className="text-xs h-7 gap-1.5 px-2.5 data-[state=active]:bg-background"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="text-xs h-7 gap-1.5 px-2.5 data-[state=active]:bg-background"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    AI Chat
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {selectedRepo && (
                <Badge variant="outline" className="text-[11px] font-mono gap-1 ml-2 hidden sm:inline-flex">
                  <FolderGit2 className="h-3 w-3 text-primary" />
                  {selectedRepo.fullName}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/inngest/trigger", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        eventName: "github.connected",
                        repositoryOwner: selectedRepo?.owner,
                        repositoryName: selectedRepo?.name,
                      }),
                    });
                    const d = await res.json();
                    if (d.success) {
                      alert(`Inngest Sync Triggered! Event: ${d.eventName}. Check your Inngest Dev Server terminal for live execution.`);
                    } else {
                      alert(`Inngest trigger error: ${d.error}`);
                    }
                  } catch (e) {
                    alert("Failed to trigger Inngest event.");
                  }
                }}
                className="h-7 text-[11px] gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                title="Trigger Inngest background jobs manually"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                Run Inngest Sync
              </Button>
            </div>
          </header>

          {/* Main View Pane */}
          <main className="flex-1 h-[calc(100vh-3rem)] overflow-y-auto">
            {activeTab === "dashboard" ? (
              <ContinueWorkingCards onSelectRepoForChat={handleSelectRepoForChat} />
            ) : (
              <ChatUI activeRepo={selectedRepo} />
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
