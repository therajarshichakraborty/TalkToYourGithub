import { createOpenAI } from "@ai-sdk/openai";

const openaiKey = process.env.OPENAI_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

const isOpenRouterKey = (key?: string) => Boolean(key && key.startsWith("sk-or-"));

let apiKey = openaiKey || openrouterKey;
let isOpenRouter = isOpenRouterKey(apiKey) || Boolean(openrouterKey && !openaiKey);

if (!apiKey) {
  throw new Error(
    "Missing API Key. Please set OPENAI_API_KEY or OPENROUTER_API_KEY in your .env file.",
  );
}

/**
 * Configure AI Provider: Direct OpenAI if valid OpenAI key exists, else OpenRouter endpoint.
 */
export const aiProvider = createOpenAI(
  isOpenRouter
    ? {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openrouterKey || apiKey,
        headers: {
          "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost:3000",
          "X-Title": "Talk-To-Your-GitHub",
        },
      }
    : {
        apiKey,
      },
);

/**
 * Chat LLM model configuration:
 * - Direct OpenAI: defaults to 'gpt-4o-mini'
 * - OpenRouter: defaults to 'openai/gpt-4o-mini'
 */
export const chatModel = aiProvider(
  process.env.OPENAI_MODEL ||
    process.env.OPENROUTER_MODEL ||
    (isOpenRouter ? "openai/gpt-4o-mini" : "gpt-4o-mini"),
);

/**
 * Text embedding model configuration
 */
export const embeddingModel = aiProvider.textEmbeddingModel(
  process.env.EMBEDDING_MODEL || "text-embedding-3-small",
);

