/**
 * Lambda handler for POST /ask
 * Answers questions using RAG: embed → query Pinecone → LLM
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { validateAskRequest } from '../utils/validation';
import { createResponse } from '../utils/response';
import { embedText } from '../services/embeddings';
import { queryByVector } from '../services/pinecone';
import { answerWithContext } from '../services/llm';
import { AskResponse, Source } from '../types';
import * as z from 'zod';

/**
 * Lambda handler
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        // Parse and validate request body
        if (!event.body) {
            return createResponse(400, { error: 'Request body is required' });
        }

        let parsedBody: unknown;
        try {
            parsedBody = JSON.parse(event.body);
        } catch {
            return createResponse(400, { error: 'Invalid JSON in request body' });
        }

        const request = validateAskRequest(parsedBody);

        // Embed the question
        const questionEmbedding = await embedText(request.question);

        // Query Pinecone for similar chunks
        const retrievedChunks = await queryByVector(questionEmbedding, request.topK);

        // Generate answer using LLM with retrieved context and chat history
        const answer = await answerWithContext(request.question, retrievedChunks, request.messages);

        // Filter chunks by relevance score - don't show sources for generic questions
        const RELEVANCE_THRESHOLD = 0.5;
        const relevantChunks = retrievedChunks.filter(chunk => chunk.score >= RELEVANCE_THRESHOLD);

        // Deduplicate sources (same doc might appear in multiple chunks)
        const sourceMap = new Map<string, Source>();
        for (const chunk of relevantChunks) {
            if (!sourceMap.has(chunk.metadata.docId)) {
                sourceMap.set(chunk.metadata.docId, {
                    docId: chunk.metadata.docId,
                    title: chunk.metadata.title,
                });
            }
        }

        const response: AskResponse = {
            answer,
            sources: Array.from(sourceMap.values()),
        };

        return createResponse(200, response);

    } catch (error) {
        console.error('Ask error:', error);

        if (error instanceof z.ZodError) {
            return createResponse(400, {
                error: 'Validation error',
                details: error.issues,
            });
        }

        return createResponse(500, {
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
