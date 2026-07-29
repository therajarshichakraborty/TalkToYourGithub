import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient: Pinecone | null = null;

/**
 * Get or initialize Pinecone client singleton.
 */
export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.warn(
        "[Pinecone] Warning: PINECONE_API_KEY is not set in environment variables.",
      );
    }
    pineconeClient = new Pinecone({
      apiKey: apiKey || "",
    });
  }
  return pineconeClient;
}

/**
 * Get Pinecone Index instance.
 * Defaults to process.env.PINECONE_INDEX_NAME or "talk-to-your-github".
 */
export function getPineconeIndex(indexName?: string) {
  const client = getPineconeClient();
  const targetIndex =
    indexName || process.env.PINECONE_INDEX_NAME || "talk-to-your-github";
  return client.index(targetIndex);
}
