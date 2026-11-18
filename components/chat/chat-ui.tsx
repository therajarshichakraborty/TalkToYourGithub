"use client";

import { useChat, type Message } from "@ai-sdk/react";
import { ArrowUp, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./markdown-renderer";
import { ToolCallCard, type ToolInvocationView } from "./tool-call-card";

const REQUEST_WINDOW = 8;

export interface ChatRepo {
  owner: string;
  name: string;
}

function suggestionsFor(repo: ChatRepo | null) {
  return repo
    ? [
        "Summarize what this repository does",
        "What changed in the last 10 commits?",
        "Which pull requests are open?",
        "What does the tech stack look like?",
      ]
    : [
        "Which of my repositories were active this week?",
        "List my private repositories",
        "Which repos use TypeScript?",
        "Find repositories with open issues",
      ];
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const invocations = (message.toolInvocations ?? []) as ToolInvocationView[];

  if (isUser) {
    return (
      <div className='flex justify-end'>
        <div className='max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground'>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className='flex gap-3'>
      <LogoMark className='mt-0.5 size-7 shrink-0' />
      <div className='min-w-0 flex-1 space-y-3'>
        {invocations.length > 0 && (
          <div className='space-y-1.5'>
            {invocations.map((inv) => (
              <ToolCallCard key={inv.toolCallId} invocation={inv} />
            ))}
          </div>
        )}
        {message.content && <MarkdownRenderer content={message.content} />}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className='flex gap-3'>
      <LogoMark className='size-7 shrink-0' />
      <div className='flex items-center gap-1 py-2' aria-label='Assistant is thinking'>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className='size-1.5 animate-pulse rounded-full bg-muted-foreground'
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function ChatUI({ repo }: { repo: ChatRepo | null }) {
  const chatId = repo ? `${repo.owner}/${repo.name}` : "general";
  const repoRef = useRef(repo);
  useEffect(() => {
    repoRef.current = repo;
  }, [repo]);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    append,
    setMessages,
    status,
    stop,
    error,
  } = useChat({
    id: chatId,
    api: "/api/chat",
    experimental_prepareRequestBody: ({ messages: all }) => ({
      activeRepo: repoRef.current,
      messages: all
        .slice(-REQUEST_WINDOW)
        .map(({ role, content }) => ({ role, content })),
    }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";

  const owner = repo?.owner;
  const name = repo?.name;
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const historyLoaded = loadedFor === chatId;

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const controller = new AbortController();
    const query =
      owner && name
        ? `?owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(name)}`
        : "";
    fetch(`/api/chat/history${query}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { messages?: Message[] };
        if (messagesRef.current.length === 0 && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoadedFor(chatId);
      });
    return () => controller.abort();
  }, [chatId, owner, name, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || busy || !historyLoaded) return;
    handleSubmit(e);
  };

  const last = messages.at(-1);
  const showThinking =
    busy &&
    (last?.role === "user" || (!last?.content && !last?.toolInvocations?.length));

  return (
    <div className='flex h-full flex-col'>
      <div ref={scrollRef} className='flex-1 overflow-y-auto'>
        <div className='mx-auto w-full max-w-3xl space-y-6 px-4 py-8'>
          {!historyLoaded && messages.length === 0 ? (
            <div className='flex justify-center pt-[20vh]'>
              <LogoMark className='size-8 animate-pulse rounded-lg' />
            </div>
          ) : messages.length === 0 ? (
            <div className='flex flex-col items-center pt-[10vh] text-center'>
              <LogoMark className='size-10 rounded-xl' />
              <h2 className='mt-5 text-2xl font-semibold tracking-tight'>
                {repo ? `Ask about ${repo.name}` : "What would you like to know?"}
              </h2>
              <p className='mt-2 max-w-md text-sm text-muted-foreground'>
                {repo
                  ? "Commits, pull requests, issues and code, answered from live GitHub data."
                  : "Ask across all of your repositories, or pick one from the sidebar to focus."}
              </p>
              <div className='mt-8 grid w-full gap-2 sm:grid-cols-2'>
                {suggestionsFor(repo).map((text) => (
                  <button
                    key={text}
                    type='button'
                    onClick={() => append({ role: "user", content: text })}
                    className='rounded-xl border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground'
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          {showThinking && <Thinking />}
          {error && (
            <p className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
              Something went wrong. Please try again.
            </p>
          )}
        </div>
      </div>

      <div className='border-t bg-background/80 backdrop-blur'>
        <form onSubmit={submit} className='mx-auto w-full max-w-3xl px-4 py-4'>
          <div className='flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-colors focus-within:border-foreground/25'>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={repo ? `Ask about ${repo.owner}/${repo.name}…` : "Ask about your repositories…"}
              aria-label='Message'
              className='max-h-50 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground'
            />
            {busy ? (
              <Button type='button' size='icon' variant='secondary' onClick={stop} aria-label='Stop'>
                <Square className='size-3.5 fill-current' />
              </Button>
            ) : (
              <Button
                type='submit'
                size='icon'
                disabled={!input.trim()}
                aria-label='Send'
                className={cn("rounded-xl", input.trim() && "shadow-button")}
              >
                <ArrowUp className='size-4' />
              </Button>
            )}
          </div>
          <p className='mt-2 text-center text-[11px] text-muted-foreground'>
            Enter to send · Shift + Enter for a new line
          </p>
        </form>
      </div>
    </div>
  );
}
