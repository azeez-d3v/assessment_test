/**
 * LLM service using OpenAI SDK with OpenRouter
 * Handles prompt building and answer generation for RAG
 * Uses shared OpenAI client from openai.ts
 */
import { RetrievedChunk, Message } from '../types';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
/**
 * Build a RAG prompt with the question, retrieved context, and optional history
 */
export declare function buildMessages(question: string, chunks: RetrievedChunk[], history?: Message[]): ChatCompletionMessageParam[];
/**
 * Generate an answer using OpenAI SDK (configured for OpenRouter)
 */
export declare function generateAnswer(messages: ChatCompletionMessageParam[]): Promise<string>;
/**
 * Complete RAG flow: build messages and generate answer
 */
export declare function answerWithContext(question: string, chunks: RetrievedChunk[], history?: Message[]): Promise<string>;
//# sourceMappingURL=llm.d.ts.map