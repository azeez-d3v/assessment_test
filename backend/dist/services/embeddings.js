"use strict";
/**
 * Embeddings service using OpenAI SDK with OpenRouter
 * Uses shared OpenAI client from openai.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedText = embedText;
exports.embedTexts = embedTexts;
exports.getEmbeddingDimension = getEmbeddingDimension;
const openai_1 = require("./openai");
// OpenRouter embedding model - text-embedding-3-small is a good balance of quality and cost
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small';
/**
 * Generate embedding for a single text
 */
async function embedText(text) {
    const response = await (0, openai_1.getOpenAIClient)().embeddings.create({
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
async function embedTexts(texts) {
    if (texts.length === 0)
        return [];
    // OpenAI SDK supports batch input
    const response = await (0, openai_1.getOpenAIClient)().embeddings.create({
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
function getEmbeddingDimension() {
    return 1536; // text-embedding-3-small dimension
}
//# sourceMappingURL=embeddings.js.map