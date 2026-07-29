/**
 * openrouter.ts
 * Configures the Vercel AI SDK to use OpenRouter as its inference backend.
 *
 * OpenRouter exposes an OpenAI-compatible REST API. We use @ai-sdk/openai
 * with a custom baseURL so that every streamText() call is routed through
 * OpenRouter's intelligent auto-router.
 *
 * Model: "openrouter/auto"
 * OpenRouter's automatic model selection: picks the best available model
 * for each request based on task complexity, latency, cost, and current
 * provider availability. No need to pin a specific model; OpenRouter decides.
 *
 * Environment variable required:
 *   OPENROUTER_API_KEY: from https://openrouter.ai/keys
 */

import { createOpenAI } from "@ai-sdk/openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "Missing OPENROUTER_API_KEY environment variable. " +
      "Get a free key at https://openrouter.ai/keys and add it to your .env file.",
  );
}

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    "X-Title": "Talk to Your GitHub",
  },
});

/**
 * OpenRouter auto-router: automatically selects the best model per request.
 * See: https://openrouter.ai/docs/model-routing
 */
export const chatModel = openrouter("openrouter/auto");

/**
 * Text embedding model configuration using OpenRouter OpenAI-compatible endpoint.
 */
export const embeddingModel = openrouter.textEmbeddingModel(
  "openai/text-embedding-3-small",
);
