/**
 * Shared OpenAI client configured for OpenRouter
 * Consolidates duplicate client initialization from llm.ts and embeddings.ts
 */
import OpenAI from 'openai';
/**
 * Get the shared OpenAI client configured for OpenRouter
 */
export declare function getOpenAIClient(): OpenAI;
/**
 * Reset the client (useful for testing)
 */
export declare function resetOpenAIClient(): void;
//# sourceMappingURL=openai.d.ts.map