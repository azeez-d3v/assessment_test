/**
 * Lambda handler for SQS-triggered async document processing
 * Handles both API-queued jobs and S3-event triggered jobs
 * Supports: .txt, .md (plain text), .pdf (Textract), .docx (Mammoth)
 */

import { SQSEvent, SQSRecord, Context, S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import mammoth from 'mammoth';
import { chunkDocument } from '../services/chunking';
import { embedTexts } from '../services/embeddings';
import { upsertChunks } from '../services/pinecone';
import { Document } from '../types';
import { ChunkingStrategy, DEFAULT_CHUNKING_STRATEGY } from '../config/chunking';

const s3Client = new S3Client({});
const textractClient = new TextractClient({});
const BUCKET = process.env.DOC_BUCKET || '';

// Supported file extensions
const TEXT_EXTENSIONS = ['.txt', '.md'];
const PDF_EXTENSIONS = ['.pdf'];
const DOCX_EXTENSIONS = ['.docx'];
const ALL_SUPPORTED = [...TEXT_EXTENSIONS, ...PDF_EXTENSIONS, ...DOCX_EXTENSIONS];

/**
 * Job format from POST /ingest API
 */
interface ApiIngestJob {
    jobId: string;
    s3Key: string;
    document: {
        id: string;
        title: string;
    };
    chunkingStrategy?: ChunkingStrategy; // Optional: defaults to recursive
}

/**
 * Get file extension from key
 */
function getFileExtension(key: string): string {
    const lastDot = key.lastIndexOf('.');
    return lastDot >= 0 ? key.substring(lastDot).toLowerCase() : '';
}

/**
 * Detect if SQS message is from S3 event notification
 */
function isS3EventRecord(body: unknown): body is S3Event {
    return (
        typeof body === 'object' &&
        body !== null &&
        'Records' in body &&
        Array.isArray((body as S3Event).Records) &&
        (body as S3Event).Records.length > 0 &&
        'eventSource' in (body as S3Event).Records[0] &&
        (body as S3Event).Records[0].eventSource === 'aws:s3'
    );
}

/**
 * Extract document metadata from S3 object
 */
async function getDocumentMetadata(bucket: string, key: string): Promise<{ docId: string; title: string; chunkingStrategy: ChunkingStrategy }> {
    try {
        const headResult = await s3Client.send(new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        }));

        // Try to get metadata from S3 object
        const metadata = headResult.Metadata || {};
        const strategyFromMeta = metadata['chunking-strategy'];
        const chunkingStrategy: ChunkingStrategy =
            (strategyFromMeta === 'fixed' || strategyFromMeta === 'recursive')
                ? strategyFromMeta
                : DEFAULT_CHUNKING_STRATEGY;

        if (metadata['doc-id'] && metadata['doc-title']) {
            return {
                docId: metadata['doc-id'],
                title: metadata['doc-title'],
                chunkingStrategy,
            };
        }
    } catch (err) {
        console.log('Could not retrieve S3 metadata, deriving from key');
    }

    // Derive from S3 key: uploads/{uuid}/{filename}.ext
    const filename = key.split('/').pop() || 'document';
    const baseName = filename.replace(/\.(txt|md|pdf|docx)$/i, '');
    const docId = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'document';

    return {
        docId,
        title: baseName || 'Untitled',
        chunkingStrategy: DEFAULT_CHUNKING_STRATEGY,
    };
}

/**
 * Extract text from PDF using pdf-parse-new (fallback method)
 */
async function extractTextWithPdfParse(bucket: string, key: string): Promise<string> {
    console.log(`Extracting text from PDF using pdf-parse-new (fallback): ${key}`);

    // Get the PDF file from S3
    const getResult = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    }));

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    if (getResult.Body) {
        const reader = getResult.Body as AsyncIterable<Uint8Array>;
        for await (const chunk of reader) {
            chunks.push(chunk);
        }
    }
    const buffer = Buffer.concat(chunks);

    // Extract text using pdf-parse-new (simple API, Lambda compatible)
    const pdfParse = (await import('pdf-parse-new')).default;
    const result = await pdfParse(buffer);
    console.log(`Extracted ${result.text.length} chars from PDF using pdf-parse-new`);
    return result.text;
}

/**
 * Extract text from PDF using AWS Textract with pdf-parse fallback
 */
async function extractTextFromPDF(bucket: string, key: string): Promise<string> {
    // Try Textract first
    try {
        console.log(`Extracting text from PDF using Textract: ${key}`);

        const response = await textractClient.send(new DetectDocumentTextCommand({
            Document: {
                S3Object: {
                    Bucket: bucket,
                    Name: key,
                },
            },
        }));

        // Extract all LINE blocks and join them
        const lines: string[] = [];
        for (const block of response.Blocks || []) {
            if (block.BlockType === 'LINE' && block.Text) {
                lines.push(block.Text);
            }
        }

        const text = lines.join('\n');
        console.log(`Extracted ${text.length} chars from PDF using Textract`);
        return text;
    } catch (error: unknown) {
        // Fall back to pdf-parse for certain errors
        const errorName = (error as { name?: string })?.name || '';
        const errorMessage = (error as { message?: string })?.message || '';

        if (errorName === 'SubscriptionRequiredException' ||
            errorMessage.includes('subscription') ||
            errorName === 'AccessDeniedException') {
            console.log(`Textract unavailable (${errorName}), falling back to pdf-parse`);
            return extractTextWithPdfParse(bucket, key);
        }

        // For other errors, still try fallback
        console.log(`Textract error (${errorName}), attempting pdf-parse fallback`);
        try {
            return await extractTextWithPdfParse(bucket, key);
        } catch (fallbackError) {
            console.error('pdf-parse fallback also failed:', fallbackError);
            throw error; // Re-throw original error
        }
    }
}

/**
 * Extract text from DOCX using Mammoth
 */
async function extractTextFromDOCX(bucket: string, key: string): Promise<string> {
    console.log(`Extracting text from DOCX using Mammoth: ${key}`);

    // Get the DOCX file from S3
    const getResult = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    }));

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    if (getResult.Body) {
        const reader = getResult.Body as AsyncIterable<Uint8Array>;
        for await (const chunk of reader) {
            chunks.push(chunk);
        }
    }
    const buffer = Buffer.concat(chunks);

    // Extract text using Mammoth
    const result = await mammoth.extractRawText({ buffer });
    console.log(`Extracted ${result.value.length} chars from DOCX`);
    return result.value;
}

/**
 * Extract text from plain text files (.txt, .md)
 */
async function extractTextFromPlainText(bucket: string, key: string): Promise<string> {
    console.log(`Reading plain text file: ${key}`);

    const getResult = await s3Client.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
    }));

    const content = await getResult.Body?.transformToString() || '';
    console.log(`Read ${content.length} chars from plain text`);
    return content;
}

/**
 * Extract text from document based on file type
 */
async function extractText(bucket: string, key: string): Promise<string> {
    const ext = getFileExtension(key);

    if (PDF_EXTENSIONS.includes(ext)) {
        return extractTextFromPDF(bucket, key);
    } else if (DOCX_EXTENSIONS.includes(ext)) {
        return extractTextFromDOCX(bucket, key);
    } else if (TEXT_EXTENSIONS.includes(ext)) {
        return extractTextFromPlainText(bucket, key);
    } else {
        console.log(`Unsupported file type: ${ext}, attempting plain text read`);
        return extractTextFromPlainText(bucket, key);
    }
}

/**
 * Process a document from S3
 */
async function processDocument(
    bucket: string,
    s3Key: string,
    docId: string,
    title: string,
    chunkingStrategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY
): Promise<void> {
    console.log(`Processing document ${docId} from ${s3Key} with ${chunkingStrategy} chunking`);

    // Extract text content based on file type
    const content = await extractText(bucket, s3Key);

    if (!content.trim()) {
        console.log('Empty document content, skipping');
        return;
    }

    // Create full document object
    const document: Document = {
        id: docId,
        title,
        content,
    };

    // Chunk the document with specified strategy
    const chunks = await chunkDocument(document, chunkingStrategy);
    console.log(`Created ${chunks.length} chunks using ${chunkingStrategy} strategy`);

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
        Bucket: bucket,
        Key: s3Key,
    }));
    console.log(`Deleted S3 object ${s3Key}`);
}

/**
 * Process a record from API-queued job
 */
async function processApiJob(job: ApiIngestJob): Promise<void> {
    console.log(`Processing API job ${job.jobId} for document ${job.document.id}`);
    const strategy = job.chunkingStrategy || DEFAULT_CHUNKING_STRATEGY;
    await processDocument(BUCKET, job.s3Key, job.document.id, job.document.title, strategy);
}

/**
 * Process a record from S3 event
 */
async function processS3Event(s3Event: S3Event): Promise<void> {
    for (const record of s3Event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log(`Processing S3 event for ${bucket}/${key}`);

        // Check if file type is supported
        const ext = getFileExtension(key);
        if (!ALL_SUPPORTED.includes(ext)) {
            console.log(`Skipping unsupported file type: ${key}`);
            continue;
        }

        // Get document metadata (includes chunking strategy from S3 metadata)
        const { docId, title, chunkingStrategy } = await getDocumentMetadata(bucket, key);
        await processDocument(bucket, key, docId, title, chunkingStrategy);
    }
}

/**
 * Process a single SQS record
 */
async function processRecord(record: SQSRecord): Promise<void> {
    const body = JSON.parse(record.body);

    if (isS3EventRecord(body)) {
        // S3 event notification wrapped in SQS
        await processS3Event(body);
    } else {
        // API-queued job
        await processApiJob(body as ApiIngestJob);
    }
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
