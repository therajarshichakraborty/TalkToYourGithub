/**
 * RecursiveCharacterTextSplitter
 * LangChain-inspired semantic text splitter for RAG pipelines.
 * Recursively splits text using a hierarchy of separators to produce chunks
 * that preserve semantic context and fit within target token/character limits.
 */

export interface TextSplitterOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: TextSplitterOptions = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 200;
    this.separators = options.separators || [
      "\n\n",
      "\n",
      "```",
      ". ",
      "? ",
      "! ",
      "; ",
      ", ",
      " ",
      "",
    ];
  }

  /**
   * Splits text into semantic chunks according to configured chunkSize and overlap.
   */
  public splitText(text: string): string[] {
    if (!text || typeof text !== "string") return [];
    const trimmed = text.trim();
    if (!trimmed) return [];
    if (trimmed.length <= this.chunkSize) return [trimmed];

    return this.recursiveSplit(trimmed, this.separators);
  }

  private recursiveSplit(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];

    // Find the best separator available
    let separator = separators[separators.length - 1];
    let newSeparators: string[] = [];

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === "" || text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = separator !== "" ? text.split(separator) : text.split("");
    let currentChunk: string[] = [];
    let currentLength = 0;

    for (const split of splits) {
      const piece = split.trim();
      if (!piece) continue;

      const pieceLength = piece.length + (separator ? separator.length : 0);

      if (currentLength + pieceLength > this.chunkSize) {
        if (currentChunk.length > 0) {
          const chunkStr = currentChunk.join(separator).trim();
          if (chunkStr.length > 20) {
            finalChunks.push(chunkStr);
          }

          // Calculate overlap
          let overlapLen = 0;
          const overlapChunk: string[] = [];
          for (let k = currentChunk.length - 1; k >= 0; k--) {
            const item = currentChunk[k];
            if (overlapLen + item.length <= this.chunkOverlap) {
              overlapChunk.unshift(item);
              overlapLen += item.length;
            } else {
              break;
            }
          }
          currentChunk = overlapChunk;
          currentLength = overlapLen;
        }

        if (piece.length > this.chunkSize && newSeparators.length > 0) {
          const subChunks = this.recursiveSplit(piece, newSeparators);
          finalChunks.push(...subChunks);
        } else {
          currentChunk.push(piece);
          currentLength += pieceLength;
        }
      } else {
        currentChunk.push(piece);
        currentLength += pieceLength;
      }
    }

    if (currentChunk.length > 0) {
      const chunkStr = currentChunk.join(separator).trim();
      if (chunkStr.length > 20) {
        finalChunks.push(chunkStr);
      }
    }

    return finalChunks;
  }
}
