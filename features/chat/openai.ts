/**
 * openrouter.ts / model.ts
 * Flexible AI model provider configuration for Vercel AI SDK.
 *
 * Supports direct OpenAI API (via OPENAI_API_KEY) with automatic fallback
 * to OpenRouter API (via OPENROUTER_API_KEY).
 *
 * Environment variables:
 *   - OPENAI_API_KEY: Direct OpenAI API Key (e.g. sk-...)
 *   - OPENROUTER_API_KEY: OpenRouter API Key (e.g. sk-or-v1-...)
 */

import { createOpenAI } from "@ai-sdk/openai";

const openaiKey = process.env.OPENAI_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!openaiKey && !openrouterKey) {
  throw new Error(
    "Missing API Key. Please set OPENAI_API_KEY or OPENROUTER_API_KEY in your .env file.",
  );
}

/**
 * Configure AI Provider: Direct OpenAI if OPENAI_API_KEY exists, else OpenRouter
 */
const aiProvider = createOpenAI({
      apiKey: openaiKey,
    })

/**
 * Chat LLM model configuration:
 * - For direct OpenAI: defaults to 'gpt-4o-mini' (or process.env.OPENAI_MODEL)
 * - For OpenRouter: defaults to 'openai/gpt-4o-mini' (or process.env.OPENROUTER_MODEL)
 */
export const chatModel = aiProvider(
  (process.env.OPENAI_MODEL || "gpt-4o-mini")
);

/**
 * Text embedding model configuration
 */
export const embeddingModel = aiProvider.textEmbeddingModel(
  openaiKey ? "text-embedding-3-small" : "openai/text-embedding-3-small"
);
