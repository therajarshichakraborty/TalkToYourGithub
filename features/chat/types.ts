/**
 * types.ts
 * Shared TypeScript types for the chat feature.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  conversationId?: string;
}

export interface ChatSessionContext {
  userId: string;
  githubLogin: string;
  connectedAt?: string;
}
