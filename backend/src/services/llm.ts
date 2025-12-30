/**
 * LLM service using OpenAI SDK with OpenRouter
 * Handles prompt building and answer generation for RAG
 * 
 * Using OpenAI SDK is cleaner and more standard - OpenRouter is fully compatible.
 */

import OpenAI from 'openai';
import { RetrievedChunk, Message } from '../types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const LLM_MODEL = process.env.LLM_MODEL || 'openai/gpt-4o-mini';

// Lazy-loaded OpenAI client configured for OpenRouter (env vars not available at module load time)
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
            // defaultHeaders: {
            //     'HTTP-Referer': process.env.APP_URL || 'https://doc-qa-portal.example.com',
            //     'X-Title': 'Doc Q&A Portal',
            // },
        });
    }
    return openai;
}

/**
 * Build a RAG prompt with the question, retrieved context, and optional history
 */
export function buildMessages(
    question: string,
    chunks: RetrievedChunk[],
    history: Message[] = []
): ChatCompletionMessageParam[] {
    // 1. Construct System Message with Context and Guidelines
    let systemContent = `You are a friendly, helpful customer support assistant. You have access to knowledge base documents to help answer questions.`;

    if (chunks.length > 0) {
        const contextParts = chunks.map((chunk, index) => {
            return `[Document ${index + 1}: "${chunk.metadata.title}"]
${chunk.metadata.chunkText}`;
        });
        const context = contextParts.join('\n\n');

        systemContent += `\n\nKNOWLEDGE BASE:\n${context}`;
    } else {
        systemContent += `\n\nNOTE: No relevant documents were found in the knowledge base for this specific query. Use your general knowledge or politely ask for clarification.`;
    }

    systemContent += `\n\nGUIDELINES:
- Be conversational and warm
- Use the information from the knowledge base but rephrase it in your own words
- Use **Markdown formatting** for emphasis and structure
- If the customer's specific situation isn't fully covered in the docs, acknowledge that clearly
- For general knowledge questions unrelated to the docs, answer helpfully using your knowledge
- Keep responses concise but friendly`;

    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: systemContent }
    ];

    // 2. Append Chat History (Limited to last 10 messages to save context)
    // Map our generic Message type to OpenAI's expected format
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
        if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        }
    });

    // 3. Append Current User Question
    messages.push({ role: 'user', content: question });

    return messages;
}

/**
 * Generate an answer using OpenAI SDK (configured for OpenRouter)
 */
export async function generateAnswer(messages: ChatCompletionMessageParam[]): Promise<string> {
    const completion = await getOpenAI().chat.completions.create({
        model: LLM_MODEL,
        messages: messages,
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('No response text from OpenRouter API');
    }

    return content.trim();
}

/**
 * Complete RAG flow: build messages and generate answer
 */
export async function answerWithContext(
    question: string,
    chunks: RetrievedChunk[],
    history: Message[] = []
): Promise<string> {
    const messages = buildMessages(question, chunks, history);
    return generateAnswer(messages);
}
