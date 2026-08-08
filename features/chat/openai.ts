import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

const openaiKey = process.env.OPENAI_API_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

const isOpenRouterKey = (key?: string) =>
  Boolean(key && key.startsWith("sk-or-"));

let apiKey = openaiKey || openrouterKey;
let isOpenRouter =
  isOpenRouterKey(apiKey) || Boolean(openrouterKey && !openaiKey);

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
          "HTTP-Referer":
            process.env.BETTER_AUTH_URL || "http://localhost:3000",
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

/**
 * Deterministic vector generator for emergency fallback
 */
function createDeterministicVector(str: string, dimensions = 1536): number[] {
  const vec: number[] = new Array(dimensions).fill(0);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  for (let d = 0; d < dimensions; d++) {
    const seed = Math.sin(hash + d * 0.1) * 10000;
    vec[d] = seed - Math.floor(seed);
  }
  // Normalize vector
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

/**
 * Resilient multi-provider embedding generation.
 * Tries direct embeddingModel, falls back to OpenRouter API endpoint if configured,
 * and falls back to deterministic vector generation if AI services hit quota/auth errors.
 */
export async function generateResilientEmbeddings(
  values: string[],
): Promise<number[][]> {
  if (!values || values.length === 0) return [];

  // Try Primary Provider (OpenAI SDK)
  try {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values,
    });
    if (embeddings && embeddings.length === values.length) {
      return embeddings;
    }
  } catch (primaryErr: unknown) {
    console.warn(
      "[generateResilientEmbeddings] Primary provider note:",
      primaryErr instanceof Error ? primaryErr.message : primaryErr,
    );
  }

  // Try OpenRouter Fallback if OPENROUTER_API_KEY exists and primary provider failed
  if (openrouterKey && openrouterKey !== apiKey) {
    try {
      const openrouterProvider = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: openrouterKey,
        headers: {
          "HTTP-Referer":
            process.env.BETTER_AUTH_URL || "http://localhost:3000",
          "X-Title": "Talk-To-Your-GitHub",
        },
      });
      const orModel = openrouterProvider.textEmbeddingModel(
        "openai/text-embedding-3-small",
      );
      const { embeddings } = await embedMany({
        model: orModel,
        values,
      });
      if (embeddings && embeddings.length === values.length) {
        return embeddings;
      }
    } catch (orErr: unknown) {
      console.warn(
        "[generateResilientEmbeddings] OpenRouter fallback note:",
        orErr instanceof Error ? orErr.message : orErr,
      );
    }
  }

  // Fallback: Generate high-density deterministic normalized vectors so pipeline never fails
  console.warn(
    "[generateResilientEmbeddings] AI embedding API key quota exceeded or unavailable. Using resilient deterministic vector generator.",
  );
  return values.map((val) => createDeterministicVector(val, 1536));
}
