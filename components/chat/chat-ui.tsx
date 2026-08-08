"use client";
/*
 * Component: ChatUI
 * Description: Interactive AI Chat Interface powered by useChat() from AI SDK.
 * Handles streaming responses, tool invocation status display, and repository context integration.
 */

import React, { useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { RepositoryItem } from "@/components/sidebar/repo-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Square,
  Bot,
  User,
  Wrench,
  Sparkles,
  GitBranch,
  FolderGit2,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCode,
  Lightbulb,
} from "lucide-react";

import { ToolCallCard } from "./tool-call-card";

interface ChatUIProps {
  activeRepo: RepositoryItem | null;
}

export function ChatUI({ activeRepo }: ChatUIProps) {
  /*
   * Initialize AI SDK useChat hook pointing to our /api/chat endpoint
   */
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      activeRepo: activeRepo
        ? { owner: activeRepo.owner, name: activeRepo.name }
        : null,
    },
    onError: (err) => {
      console.error("[ChatUI] useChat error:", err);
    },
  });

  /* Auto-scroll container reference */
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /*
   * Fetch chat history for the active repository from /api/chat/history
   */
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const query = activeRepo
          ? `?owner=${encodeURIComponent(activeRepo.owner)}&name=${encodeURIComponent(activeRepo.name)}`
          : "";
        const res = await fetch(`/api/chat/history${query}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.warn("[ChatUI] Note loading history:", err);
      }
    };

    fetchHistory();
  }, [activeRepo?.owner, activeRepo?.name]);

  /* Scroll to bottom when messages update or loading state changes */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /*
   * Preset starter prompts to help users quickly trigger repository actions
   */
  const samplePrompts = activeRepo
    ? [
        `Review PR #1 in ${activeRepo.fullName}.`,
        `What are the recent commits in ${activeRepo.fullName}?`,
        `List all active branches for ${activeRepo.fullName}.`,
        `Summarize the repository structure and purpose of ${activeRepo.name}.`,
      ]
    : [
        "List all my connected GitHub repositories.",
        "What are my recent activities across all repositories?",
        "Show me recent commits across my projects.",
        "Help me understand my GitHub project status.",
      ];

  /*
   * Helper function to append a sample prompt directly to the chat
   */
  const handlePromptClick = (promptText: string) => {
    append({
      role: "user",
      content: promptText,
    });
  };

  /*
   * Render helper for AI tool invocation steps (e.g. reviewPullRequest, getCommits, getBranches, etc.)
   */
  const renderToolInvocations = (toolInvocations: any[]) => {
    if (!toolInvocations || toolInvocations.length === 0) return null;

    return (
      <div className='my-2 space-y-2'>
        <div className='flex items-center gap-1.5 font-medium text-muted-foreground text-xs'>
          <Wrench className='h-3.5 w-3.5 text-primary' />
          <span>Executed AI Tools ({toolInvocations.length})</span>
        </div>
        {toolInvocations.map((tool, idx) => (
          <ToolCallCard
            key={tool.toolCallId || idx}
            toolName={tool.toolName}
            args={tool.args}
            result={tool.result}
            state={tool.state}
          />
        ))}
      </div>
    );
  };

  return (
    <div className='flex flex-col h-full w-full bg-background overflow-hidden'>
      {/* Top Header Status Bar */}
      <div className='flex items-center justify-between border-b px-4 py-3 bg-muted/20 shrink-0'>
        <div className='flex items-center gap-2.5'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <Bot className='h-4 w-4' />
          </div>
          <div>
            <h2 className='font-semibold text-sm leading-none flex items-center gap-2'>
              GitHub AI Assistant
              <Badge variant='outline' className='text-[10px] px-1.5 py-0'>
                GPT-4o / AI SDK
              </Badge>
            </h2>
            <p className='text-[11px] text-muted-foreground mt-0.5'>
              {activeRepo ? (
                <span className='flex items-center gap-1'>
                  Active context:{" "}
                  <strong className='text-foreground'>
                    {activeRepo.fullName}
                  </strong>
                </span>
              ) : (
                "Scope: All connected repositories"
              )}
            </p>
          </div>
        </div>

        {activeRepo && (
          <Badge
            variant='secondary'
            className='flex items-center gap-1 text-xs'
          >
            <FolderGit2 className='h-3 w-3' />
            {activeRepo.name}
          </Badge>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {/* Welcome State when conversation is empty */}
        {messages.length === 0 && (
          <div className='max-w-2xl mx-auto py-10 text-center space-y-6'>
            <div className='inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/10 border border-indigo-200/60 dark:border-indigo-900/40'>
              <Sparkles className='h-8 w-8' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-2xl font-bold tracking-tight text-foreground'>
                {activeRepo
                  ? `Talk to ${activeRepo.name}`
                  : "Welcome to TalkToYourGitHub"}
              </h3>
              <p className='text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed'>
                {activeRepo
                  ? `Ask anything about commits, branches, issues, or code structure in ${activeRepo.fullName}.`
                  : "Ask questions, review commits, inspect issues, or trigger repository summaries using natural language."}
              </p>
            </div>

            {/* Quick Action Suggestion Cards */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-4'>
              {samplePrompts.map((prompt, idx) => (
                <Card
                  key={idx}
                  onClick={() => handlePromptClick(prompt)}
                  className='p-4 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-900/50 cursor-pointer transition-all border-border/80 shadow-xs rounded-2xl flex items-start gap-3 group'
                >
                  <div className='p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-110 transition-transform'>
                    <Lightbulb className='h-4 w-4' />
                  </div>
                  <span className='text-xs text-muted-foreground group-hover:text-foreground font-semibold leading-snug'>
                    {prompt}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rendered Messages */}
        {messages.map((message: any) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`flex items-start gap-3 max-w-3xl ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Message Avatar */}
              <Avatar className='h-8 w-8 shrink-0 mt-0.5 border shadow-xs'>
                <AvatarFallback
                  className={
                    isUser
                      ? "bg-indigo-600 text-white text-xs font-bold"
                      : "bg-muted text-foreground text-xs"
                  }
                >
                  {isUser ? (
                    <User className='h-4 w-4' />
                  ) : (
                    <Bot className='h-4 w-4' />
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Message Content Bubble */}
              <div className='space-y-1 max-w-[85%]'>
                {message.content ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm shadow-xs leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-xs font-medium"
                        : "bg-card text-foreground border rounded-tl-xs"
                    }`}
                  >
                    <div className='whitespace-pre-wrap break-words'>
                      {message.content}
                    </div>
                  </div>
                ) : isUser ? (
                  <div className='rounded-2xl px-4 py-3 text-sm bg-indigo-600 text-white rounded-tr-xs'>
                    {message.content}
                  </div>
                ) : !(message as any).toolInvocations?.length ? (
                  <div className='rounded-2xl px-4 py-3 text-sm bg-card text-muted-foreground border rounded-tl-xs flex items-center gap-2.5'>
                    <Loader2 className='h-4 w-4 animate-spin text-indigo-600' />
                    <span>Analyzing repository & fetching context...</span>
                  </div>
                ) : null}

                {/* Render Tool Invocations if Assistant executed tools */}
                {!isUser &&
                  renderToolInvocations((message as any).toolInvocations)}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator when streaming */}
        {isLoading && (
          <div className='flex items-center gap-3 text-xs text-muted-foreground max-w-3xl mr-auto pt-1'>
            <Avatar className='h-8 w-8 shrink-0 border'>
              <AvatarFallback className='bg-muted text-foreground text-xs'>
                <Bot className='h-4 w-4' />
              </AvatarFallback>
            </Avatar>
            <div className='flex items-center gap-2.5 rounded-2xl bg-card px-4 py-2.5 border shadow-xs'>
              <Loader2 className='h-4 w-4 animate-spin text-indigo-600' />
              <span>Thinking and fetching GitHub data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <div className='p-4 border-t bg-background shrink-0'>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            handleSubmit(e);
          }}
          className='flex items-center gap-3 max-w-4xl mx-auto'
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              activeRepo
                ? `Ask about ${activeRepo.name} (e.g. commits, issues, branches)...`
                : "Ask about your GitHub repositories..."
            }
            className='flex-1 h-11 text-sm bg-muted/30 border-border/80 focus-visible:ring-indigo-500 rounded-full px-5'
          />

          {isLoading ? (
            <Button
              type='button'
              onClick={() => stop()}
              variant='outline'
              size='icon'
              className='h-11 w-11 rounded-full text-destructive border-destructive/40 hover:bg-destructive/10 shrink-0'
              title='Stop response'
            >
              <Square className='h-4 w-4 fill-current' />
            </Button>
          ) : (
            <Button
              type='submit'
              disabled={!input.trim()}
              size='icon'
              className='h-11 w-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/25 shrink-0 transition-all hover:scale-105'
              title='Send message'
            >
              <Send className='h-4 w-4' />
            </Button>
          )}
        </form>
        <p className='text-[10px] text-center text-muted-foreground mt-2 font-normal'>
          TalkToYourGitHub executes read and write operations via live GitHub API & Corsair sync layer.
        </p>
      </div>
    </div>
  );
}
