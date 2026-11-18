import type { Metadata } from "next";
import { ChatUI } from "@/components/chat/chat-ui";
import { AppShell } from "@/components/workspace/app-shell";

export const metadata: Metadata = { title: "Assistant" };

export default function ChatPage() {
  return (
    <AppShell title='Assistant · All repositories' contentClassName='overflow-hidden'>
      <ChatUI repo={null} />
    </AppShell>
  );
}
