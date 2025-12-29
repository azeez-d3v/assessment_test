/**
 * LLM service using OpenRouter SDK
 * Handles prompt building and answer generation for RAG
 */

import { OpenRouter } from '@openrouter/sdk';
import { RetrievedChunk } from '../types';

const LLM_MODEL = process.env.LLM_MODEL || 'google/gemini-2.0-flash-lite-001';

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

/**
 * Build a RAG prompt with the question and retrieved context
 */
export function buildPrompt(question: string, chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
        return `You are a helpful assistant. The user asked a question but no relevant documents were found in the knowledge base.

Question: ${question}

Please respond by saying that you don't have enough information in the provided documents to answer this question, and suggest they try rephrasing or check if relevant documents have been uploaded.`;
    }

    const contextParts = chunks.map((chunk, index) => {
        return `[Document ${index + 1}: "${chunk.metadata.title}"]
${chunk.metadata.chunkText}`;
    });

    const context = contextParts.join('\n\n');

    return `You are a friendly, helpful customer support assistant. You have access to knowledge base documents to help answer questions.

KNOWLEDGE BASE:
${context}

CUSTOMER QUESTION: ${question}

GUIDELINES:
- Be conversational and warm - talk naturally, not like you're reading from a script
- Use the information from the knowledge base but rephrase it in your own words
- Use **Markdown formatting** for emphasis and structure:
  - Use **bold** for key concepts or important details
  - Use *italics* for gentle emphasis
  - Use bullet points or numbered lists for steps or multiple items
  - Use headings (###) to organize long responses
- If the customer's specific situation isn't fully covered in the docs, acknowledge that clearly and suggest contacting support for their specific case
- For general knowledge questions unrelated to the docs, answer helpfully using your knowledge
- Keep responses concise but friendly
- Start with empathy when the customer has an issue (e.g., "I understand you received an item with damage...")

YOUR RESPONSE:`;
}

/**
 * Generate an answer using OpenRouter SDK
 */
export async function generateAnswer(prompt: string): Promise<string> {
    const response = await getOpenRouter().chat.send({
        model: LLM_MODEL,
        messages: [
            { role: 'user', content: prompt }
        ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('No response text from OpenRouter API');
    }

    if (typeof content === 'string') {
        return content.trim();
    }

    // If it's an array, extract text from text items
    const textParts = content
        .filter((item): item is { type: 'text'; text: string } => 'type' in item && item.type === 'text')
        .map(item => item.text);

    return textParts.join('').trim();
}

/**
 * Complete RAG flow: build prompt and generate answer
 */
export async function answerWithContext(
    question: string,
    chunks: RetrievedChunk[]
): Promise<string> {
    const prompt = buildPrompt(question, chunks);
    return generateAnswer(prompt);
}
