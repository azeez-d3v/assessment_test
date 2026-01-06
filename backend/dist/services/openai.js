"use strict";
/**
 * Shared OpenAI client configured for OpenRouter
 * Consolidates duplicate client initialization from llm.ts and embeddings.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAIClient = getOpenAIClient;
exports.resetOpenAIClient = resetOpenAIClient;
const openai_1 = __importDefault(require("openai"));
// Lazy-loaded OpenAI client (env vars not available at module load time)
let openaiClient = null;
/**
 * Get the shared OpenAI client configured for OpenRouter
 */
function getOpenAIClient() {
    if (!openaiClient) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('OPENROUTER_API_KEY environment variable is required');
        }
        openaiClient = new openai_1.default({
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
function resetOpenAIClient() {
    openaiClient = null;
}
//# sourceMappingURL=openai.js.map