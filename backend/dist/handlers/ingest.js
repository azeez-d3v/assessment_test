"use strict";
/**
 * Lambda handler for POST /ingest (ASYNC)
 * Writes documents to S3 and queues to SQS for background processing
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_sqs_1 = require("@aws-sdk/client-sqs");
const validation_1 = require("../utils/validation");
const response_1 = require("../utils/response");
const z = __importStar(require("zod"));
const crypto_1 = require("crypto");
const s3Client = new client_s3_1.S3Client({});
const sqsClient = new client_sqs_1.SQSClient({});
const BUCKET = process.env.DOC_BUCKET || '';
const QUEUE_URL = process.env.INGEST_QUEUE_URL || '';
// Check if async mode is enabled (S3 and SQS configured)
const isAsyncMode = () => Boolean(BUCKET && QUEUE_URL);
/**
 * Async ingest: Write to S3 and queue to SQS (parallelized)
 */
async function asyncIngest(documents, chunkingStrategy = 'recursive') {
    const jobId = (0, crypto_1.randomUUID)();
    const jobs = [];
    // Process all documents in parallel for better performance
    await Promise.all(documents.map(async (doc) => {
        const s3Key = `ingest/${jobId}/${doc.id}.txt`;
        // Write document content to S3
        await s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
            Body: doc.content,
            ContentType: 'text/plain',
        }));
        // Queue SQS message for worker
        await sqsClient.send(new client_sqs_1.SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({
                jobId,
                s3Key,
                document: {
                    id: doc.id,
                    title: doc.title,
                },
                chunkingStrategy, // Pass strategy to worker
            }),
        }));
        jobs.push({ docId: doc.id, s3Key });
    }));
    return { jobId, documentsQueued: jobs.length };
}
/**
 * Sync ingest: Process immediately (fallback for local dev)
 */
async function syncIngest(documents, chunkingStrategy = 'recursive') {
    const { chunkDocument } = await Promise.resolve().then(() => __importStar(require('../services/chunking')));
    const { embedTexts } = await Promise.resolve().then(() => __importStar(require('../services/embeddings')));
    const { upsertChunks } = await Promise.resolve().then(() => __importStar(require('../services/pinecone')));
    const allChunks = [];
    for (const doc of documents) {
        const chunks = await chunkDocument(doc, chunkingStrategy);
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
async function handler(event) {
    try {
        // Parse and validate request body
        if (!event.body) {
            return (0, response_1.createResponse)(400, { error: 'Request body is required' });
        }
        let parsedBody;
        try {
            parsedBody = JSON.parse(event.body);
        }
        catch {
            return (0, response_1.createResponse)(400, { error: 'Invalid JSON in request body' });
        }
        const request = (0, validation_1.validateIngestRequest)(parsedBody);
        if (request.documents.length === 0) {
            return (0, response_1.createResponse)(400, { error: 'No documents to ingest' });
        }
        // Use async mode if S3/SQS are configured, otherwise sync
        if (isAsyncMode()) {
            const result = await asyncIngest(request.documents, request.chunkingStrategy);
            return (0, response_1.createResponse)(202, {
                status: 'accepted',
                message: 'Documents queued for processing',
                chunkingStrategy: request.chunkingStrategy,
                ...result,
            });
        }
        else {
            // Sync fallback for local development
            const result = await syncIngest(request.documents, request.chunkingStrategy);
            return (0, response_1.createResponse)(200, { ...result, chunkingStrategy: request.chunkingStrategy });
        }
    }
    catch (error) {
        console.error('Ingest error:', error);
        if (error instanceof z.ZodError) {
            return (0, response_1.createResponse)(400, {
                error: 'Validation error',
                details: error.issues,
            });
        }
        return (0, response_1.createResponse)(500, {
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=ingest.js.map