/**
 * Shared OpenAI client configured for OpenRouter
 * Consolidates duplicate client initialization from llm.ts and embeddings.ts
 */

import OpenAI from 'openai';

// Lazy-loaded OpenAI client (env vars not available at module load time)
let openaiClient: OpenAI | null = null;

/**
 * Get the shared OpenAI client configured for OpenRouter
 */
export function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY environment variable is required');
        }
        openaiClient = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey,
            defaultHeaders: {
                'HTTP-Referer': process.env.APP_URL || 'https://doc-qa-portal.example.com',
                'X-Title': 'Doc Q&A Portal',
            },
        });
    }
    return openaiClient;
}

/**
 * Reset the client (useful for testing)
 */
export function resetOpenAIClient(): void {
    openaiClient = null;
}
