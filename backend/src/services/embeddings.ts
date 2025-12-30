/**
 * Embeddings service using OpenAI SDK with OpenRouter
 * Consolidated with LLM to use single API key
 * 
 * Using OpenAI SDK is cleaner and more standard - OpenRouter is fully compatible.
 */

import OpenAI from 'openai';

// Lazy-loaded OpenAI client (env vars not available at module load time)
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openai) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY environment variable is required');
        }
        openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey,
            defaultHeaders: {
                'HTTP-Referer': process.env.APP_URL || 'https://doc-qa-portal.example.com',
                'X-Title': 'Doc Q&A Portal',
            },
        });
    }
    return openai;
}

// OpenRouter embedding model - text-embedding-3-small is a good balance of quality and cost
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';

/**
 * Generate embedding for a single text
 */
export async function embedText(text: string): Promise<number[]> {
    const response = await getOpenAI().embeddings.create({
        input: text,
        model: EMBEDDING_MODEL,
    });

    const embedding = response.data?.[0]?.embedding;

    if (!embedding || embedding.length === 0) {
        throw new Error('No embedding returned from OpenRouter API');
    }

    return embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    // OpenAI SDK supports batch input
    const response = await getOpenAI().embeddings.create({
        input: texts,
        model: EMBEDDING_MODEL,
    });

    if (!response.data || response.data.length === 0) {
        throw new Error('No embeddings returned from OpenRouter API');
    }

    return response.data.map(item => item.embedding);
}

/**
 * Get the embedding dimension for Pinecone index configuration
 * text-embedding-3-small: 1536 dimensions
 */
export function getEmbeddingDimension(): number {
    return 1536; // text-embedding-3-small dimension
}
