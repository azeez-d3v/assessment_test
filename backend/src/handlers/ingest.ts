/**
 * Lambda handler for POST /ingest (ASYNC)
 * Writes documents to S3 and queues to SQS for background processing
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { validateIngestRequest } from '../utils/validation';
import { createResponse } from '../utils/response';
import * as z from 'zod';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

const BUCKET = process.env.DOC_BUCKET || '';
const QUEUE_URL = process.env.INGEST_QUEUE_URL || '';

// Check if async mode is enabled (S3 and SQS configured)
const isAsyncMode = () => Boolean(BUCKET && QUEUE_URL);

/**
 * Async ingest: Write to S3 and queue to SQS (parallelized)
 */
async function asyncIngest(documents: Array<{ id: string; title: string; content: string }>) {
    const jobId = randomUUID();
    const jobs: Array<{ docId: string; s3Key: string }> = [];

    // Process all documents in parallel for better performance
    await Promise.all(documents.map(async (doc) => {
        const s3Key = `ingest/${jobId}/${doc.id}.txt`;

        // Write document content to S3
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
            Body: doc.content,
            ContentType: 'text/plain',
        }));

        // Queue SQS message for worker
        await sqsClient.send(new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({
                jobId,
                s3Key,
                document: {
                    id: doc.id,
                    title: doc.title,
                },
            }),
        }));

        jobs.push({ docId: doc.id, s3Key });
    }));

    return { jobId, documentsQueued: jobs.length };
}

/**
 * Sync ingest: Process immediately (fallback for local dev)
 */
async function syncIngest(documents: Array<{ id: string; title: string; content: string }>) {
    const { chunkDocument } = await import('../services/chunking');
    const { embedTexts } = await import('../services/embeddings');
    const { upsertChunks } = await import('../services/pinecone');

    const allChunks: Array<{ id: string; text: string; index: number; docId: string; title: string }> = [];

    for (const doc of documents) {
        const chunks = chunkDocument(doc);
        allChunks.push(...chunks);
    }

    if (allChunks.length === 0) {
        return { ingestedDocuments: documents.length, ingestedChunks: 0 };
    }

    const chunkTexts = allChunks.map((c) => c.text);
    const embeddings = await embedTexts(chunkTexts);
    await upsertChunks(allChunks, embeddings);

    return {
        ingestedDocuments: documents.length,
        ingestedChunks: allChunks.length,
    };
}

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

        const request = validateIngestRequest(parsedBody);

        if (request.documents.length === 0) {
            return createResponse(400, { error: 'No documents to ingest' });
        }

        // Use async mode if S3/SQS are configured, otherwise sync
        if (isAsyncMode()) {
            const result = await asyncIngest(request.documents);
            return createResponse(202, {
                status: 'accepted',
                message: 'Documents queued for processing',
                ...result,
            });
        } else {
            // Sync fallback for local development
            const result = await syncIngest(request.documents);
            return createResponse(200, result);
        }

    } catch (error) {
        console.error('Ingest error:', error);

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
