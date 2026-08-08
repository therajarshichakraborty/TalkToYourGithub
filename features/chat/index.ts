/**
 * index.ts
 * Public API of the chat feature module.
 * Import everything the route handler and UI hooks need from this single entry point.
 */

export { buildSystemPrompt } from "./system-prompt";
export { buildToolRegistry } from "./tool-registry";
export { chatModel } from "./openai";
export type { ChatMessage, ChatRequestBody, ChatSessionContext } from "./types";
export type { SystemPromptContext } from "./system-prompt";
export type { ToolRegistryContext, ToolRegistry } from "./tool-registry";


