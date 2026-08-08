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
 * Defaults to process.env.PINECONE_INDEX or "talk-to-your-github".
 */
export function getPineconeIndex(indexName?: string) {
  const client = getPineconeClient();
  const targetIndex = (
    indexName ||
    process.env.PINECONE_INDEX ||
    process.env.PINECONE_INDEX_NAME ||
    "talk-to-your-github"
  ).trim();

  let host = (
    process.env.PINECONE_HOST ||
    process.env.PINECONE_HOST_NAME ||
    ""
  ).trim();

  if (host && !host.startsWith("http://") && !host.startsWith("https://")) {
    host = `https://${host}`;
  }

  try {
    return host ? client.index(targetIndex, host) : client.index(targetIndex);
  } catch (err) {
    console.warn(
      "[Pinecone] Note initializing index with host, falling back to standard index:",
      err,
    );
    return client.index(targetIndex);
  }
}
