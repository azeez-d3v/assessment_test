/**
 * Embeddings service using OpenRouter SDK
 * Consolidated with LLM to use single API key
 */

import { OpenRouter } from '@openrouter/sdk';

// Lazy-loaded OpenRouter client (env vars not available at module load time)
let openRouter: OpenRouter | null = null;

function getOpenRouter(): OpenRouter {
    if (!openRouter) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY environment variable is required');
        }
        openRouter = new OpenRouter({ apiKey });
    }
    return openRouter;
}

// OpenRouter embedding model - text-embedding-3-small is a good balance of quality and cost
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';

/**
 * Generate embedding for a single text
 */
export async function embedText(text: string): Promise<number[]> {
    const response = await getOpenRouter().embeddings.generate({
        input: text,
        model: EMBEDDING_MODEL,
    });

    // Response can be string or object with data array
    if (typeof response === 'string') {
        throw new Error('Unexpected string response from OpenRouter embeddings API');
    }

    const embedding = response.data?.[0]?.embedding;

    if (!embedding || (Array.isArray(embedding) && embedding.length === 0)) {
        throw new Error('No embedding returned from OpenRouter API');
    }

    // Embedding can be number[] or base64 string
    if (typeof embedding === 'string') {
        throw new Error('Base64 embedding format not supported');
    }

    return embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    // OpenRouter supports batch input
    const response = await getOpenRouter().embeddings.generate({
        input: texts,
        model: EMBEDDING_MODEL,
    });

    // Response can be string or object with data array
    if (typeof response === 'string') {
        throw new Error('Unexpected string response from OpenRouter embeddings API');
    }

    if (!response.data || response.data.length === 0) {
        throw new Error('No embeddings returned from OpenRouter API');
    }

    return response.data.map(item => {
        if (typeof item.embedding === 'string') {
            throw new Error('Base64 embedding format not supported');
        }
        return item.embedding;
    });
}

/**
 * Get the embedding dimension for Pinecone index configuration
 * text-embedding-3-small: 1536 dimensions
 */
export function getEmbeddingDimension(): number {
    return 1536; // text-embedding-3-small dimension
}
