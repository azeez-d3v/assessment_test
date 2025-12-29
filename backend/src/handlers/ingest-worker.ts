/**
 * Lambda handler for SQS-triggered async document processing
 * Reads document from S3, chunks, embeds, and upserts to Pinecone
 */

import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { chunkDocument } from '../services/chunking';
import { embedTexts } from '../services/embeddings';
import { upsertChunks } from '../services/pinecone';
import { Document } from '../types';

const s3Client = new S3Client({});
const BUCKET = process.env.DOC_BUCKET || '';

interface IngestJob {
    jobId: string;
    s3Key: string;
    document: {
        id: string;
        title: string;
    };
}

/**
 * Process a single SQS record
 */
async function processRecord(record: SQSRecord): Promise<void> {
    const job: IngestJob = JSON.parse(record.body);
    console.log(`Processing job ${job.jobId} for document ${job.document.id}`);

    // Read document content from S3
    const getResult = await s3Client.send(new GetObjectCommand({
        Bucket: BUCKET,
        Key: job.s3Key,
    }));

    const content = await getResult.Body?.transformToString() || '';
    console.log(`Read ${content.length} chars from S3`);

    // Create full document object
    const document: Document = {
        id: job.document.id,
        title: job.document.title,
        content,
    };

    // Chunk the document
    const chunks = chunkDocument(document);
    console.log(`Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
        console.log('No chunks to process, skipping');
        return;
    }

    // Generate embeddings for all chunks
    const texts = chunks.map(c => c.text);
    const embeddings = await embedTexts(texts);
    console.log(`Generated ${embeddings.length} embeddings`);

    // Upsert to Pinecone
    await upsertChunks(chunks, embeddings);
    console.log(`Upserted to Pinecone`);

    // Delete the S3 object (cleanup)
    await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: job.s3Key,
    }));
    console.log(`Deleted S3 object ${job.s3Key}`);
}

/**
 * Lambda handler for SQS events
 */
export async function handler(event: SQSEvent, context: Context): Promise<void> {
    console.log(`Processing ${event.Records.length} SQS records`);

    for (const record of event.Records) {
        try {
            await processRecord(record);
        } catch (error) {
            console.error(`Error processing record:`, error);
            // Re-throw to let SQS retry via redrive policy
            throw error;
        }
    }

    console.log('All records processed successfully');
}
