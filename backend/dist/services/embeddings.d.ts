/**
 * Embeddings service using OpenAI SDK with OpenRouter
 * Uses shared OpenAI client from openai.ts
 */
/**
 * Generate embedding for a single text
 */
export declare function embedText(text: string): Promise<number[]>;
/**
 * Generate embeddings for multiple texts (batch)
 */
export declare function embedTexts(texts: string[]): Promise<number[][]>;
/**
 * Get the embedding dimension for Pinecone index configuration
 * text-embedding-3-small: 1536 dimensions
 */
export declare function getEmbeddingDimension(): number;
//# sourceMappingURL=embeddings.d.ts.map