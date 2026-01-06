"use strict";
/**
 * Lambda handler for SQS-triggered async document processing
 * Handles both API-queued jobs and S3-event triggered jobs
 * Supports: .txt, .md (plain text), .pdf (Textract), .docx (Mammoth)
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_textract_1 = require("@aws-sdk/client-textract");
const mammoth_1 = __importDefault(require("mammoth"));
const chunking_1 = require("../services/chunking");
const embeddings_1 = require("../services/embeddings");
const pinecone_1 = require("../services/pinecone");
const azure_doc_intel_1 = require("../services/azure-doc-intel");
const chunking_2 = require("../config/chunking");
const s3Client = new client_s3_1.S3Client({});
const textractClient = new client_textract_1.TextractClient({});
const BUCKET = process.env.DOC_BUCKET || '';
// Supported file extensions
const TEXT_EXTENSIONS = ['.txt', '.md'];
const PDF_EXTENSIONS = ['.pdf'];
const DOCX_EXTENSIONS = ['.docx'];
const ALL_SUPPORTED = [...TEXT_EXTENSIONS, ...PDF_EXTENSIONS, ...DOCX_EXTENSIONS];
/**
 * Get file extension from key
 */
function getFileExtension(key) {
    const lastDot = key.lastIndexOf('.');
    return lastDot >= 0 ? key.substring(lastDot).toLowerCase() : '';
}
/**
 * Detect if SQS message is from S3 event notification
 */
function isS3EventRecord(body) {
    return (typeof body === 'object' &&
        body !== null &&
        'Records' in body &&
        Array.isArray(body.Records) &&
        body.Records.length > 0 &&
        'eventSource' in body.Records[0] &&
        body.Records[0].eventSource === 'aws:s3');
}
/**
 * Extract document metadata from S3 object
 */
async function getDocumentMetadata(bucket, key) {
    try {
        const headResult = await s3Client.send(new client_s3_1.HeadObjectCommand({
            Bucket: bucket,
            Key: key,
        }));
        // Try to get metadata from S3 object
        const metadata = headResult.Metadata || {};
        const strategyFromMeta = metadata['chunking-strategy'];
        const chunkingStrategy = (strategyFromMeta === 'fixed' || strategyFromMeta === 'recursive')
            ? strategyFromMeta
            : chunking_2.DEFAULT_CHUNKING_STRATEGY;
        if (metadata['doc-id'] && metadata['doc-title']) {
            return {
                docId: metadata['doc-id'],
                title: metadata['doc-title'],
                chunkingStrategy,
            };
        }
    }
    catch (err) {
        console.log('Could not retrieve S3 metadata, deriving from key');
    }
    // Derive from S3 key: uploads/{uuid}/{filename}.ext
    const filename = key.split('/').pop() || 'document';
    const baseName = filename.replace(/\.(txt|md|pdf|docx)$/i, '');
    const docId = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'document';
    return {
        docId,
        title: baseName || 'Untitled',
        chunkingStrategy: chunking_2.DEFAULT_CHUNKING_STRATEGY,
    };
}
/**
 * Extract text from PDF using pdf-parse-new (fallback method)
 */
async function extractTextWithPdfParse(bucket, key) {
    console.log(`Extracting text from PDF using pdf-parse-new (fallback): ${key}`);
    // Get the PDF file from S3
    const getResult = await s3Client.send(new client_s3_1.GetObjectCommand({
        Bucket: bucket,
        Key: key,
    }));
    // Convert stream to buffer
    const chunks = [];
    if (getResult.Body) {
        const reader = getResult.Body;
        for await (const chunk of reader) {
            chunks.push(chunk);
        }
    }
    const buffer = Buffer.concat(chunks);
    // Extract text using pdf-parse-new (simple API, Lambda compatible)
    const pdfParse = (await Promise.resolve().then(() => __importStar(require('pdf-parse-new')))).default;
    const result = await pdfParse(buffer);
    console.log(`Extracted ${result.text.length} chars from PDF using pdf-parse-new`);
    return result.text;
}
/**
 * Extract text from PDF using Azure Document Intelligence (if configured),
 * with fallback to AWS Textract, then pdf-parse
 */
async function extractTextFromPDF(bucket, key) {
    // Get PDF buffer from S3 (needed for Azure)
    const getResult = await s3Client.send(new client_s3_1.GetObjectCommand({
        Bucket: bucket,
        Key: key,
    }));
    const chunks = [];
    if (getResult.Body) {
        const reader = getResult.Body;
        for await (const chunk of reader) {
            chunks.push(chunk);
        }
    }
    const buffer = Buffer.concat(chunks);
    // Try Azure Document Intelligence first (if configured)
    if ((0, azure_doc_intel_1.isAzureConfigured)()) {
        try {
            console.log(`Extracting text from PDF using Azure Document Intelligence: ${key}`);
            const content = await (0, azure_doc_intel_1.analyzeDocumentWithAzure)(buffer);
            console.log(`Extracted ${content.length} chars from PDF using Azure (Markdown format)`);
            return content;
        }
        catch (azureError) {
            console.log(`Azure Document Intelligence failed, falling back to Textract:`, azureError);
            // Fall through to Textract
        }
    }
    // Try Textract second
    try {
        console.log(`Extracting text from PDF using Textract: ${key}`);
        const response = await textractClient.send(new client_textract_1.DetectDocumentTextCommand({
            Document: {
                S3Object: {
                    Bucket: bucket,
                    Name: key,
                },
            },
        }));
        // Extract all LINE blocks and join them
        const lines = [];
        for (const block of response.Blocks || []) {
            if (block.BlockType === 'LINE' && block.Text) {
                lines.push(block.Text);
            }
        }
        const text = lines.join('\n');
        console.log(`Extracted ${text.length} chars from PDF using Textract`);
        return text;
    }
    catch (error) {
        // Fall back to pdf-parse for certain errors
        const errorName = error?.name || '';
        const errorMessage = error?.message || '';
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
        }
        catch (fallbackError) {
            console.error('pdf-parse fallback also failed:', fallbackError);
            throw error; // Re-throw original error
        }
    }
}
/**
 * Extract text from DOCX using Mammoth
 */
async function extractTextFromDOCX(bucket, key) {
    console.log(`Extracting text from DOCX using Mammoth: ${key}`);
    // Get the DOCX file from S3
    const getResult = await s3Client.send(new client_s3_1.GetObjectCommand({
        Bucket: bucket,
        Key: key,
    }));
    // Convert stream to buffer
    const chunks = [];
    if (getResult.Body) {
        const reader = getResult.Body;
        for await (const chunk of reader) {
            chunks.push(chunk);
        }
    }
    const buffer = Buffer.concat(chunks);
    // Extract text using Mammoth
    const result = await mammoth_1.default.extractRawText({ buffer });
    console.log(`Extracted ${result.value.length} chars from DOCX`);
    return result.value;
}
/**
 * Extract text from plain text files (.txt, .md)
 */
async function extractTextFromPlainText(bucket, key) {
    console.log(`Reading plain text file: ${key}`);
    const getResult = await s3Client.send(new client_s3_1.GetObjectCommand({
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
async function extractText(bucket, key) {
    const ext = getFileExtension(key);
    if (PDF_EXTENSIONS.includes(ext)) {
        return extractTextFromPDF(bucket, key);
    }
    else if (DOCX_EXTENSIONS.includes(ext)) {
        return extractTextFromDOCX(bucket, key);
    }
    else if (TEXT_EXTENSIONS.includes(ext)) {
        return extractTextFromPlainText(bucket, key);
    }
    else {
        console.log(`Unsupported file type: ${ext}, attempting plain text read`);
        return extractTextFromPlainText(bucket, key);
    }
}
/**
 * Process a document from S3
 */
async function processDocument(bucket, s3Key, docId, title, chunkingStrategy = chunking_2.DEFAULT_CHUNKING_STRATEGY) {
    console.log(`Processing document ${docId} from ${s3Key} with ${chunkingStrategy} chunking`);
    // Extract text content based on file type
    const content = await extractText(bucket, s3Key);
    if (!content.trim()) {
        console.log('Empty document content, skipping');
        return;
    }
    // Create full document object
    const document = {
        id: docId,
        title,
        content,
    };
    // Chunk the document with specified strategy
    const chunks = await (0, chunking_1.chunkDocument)(document, chunkingStrategy);
    console.log(`Created ${chunks.length} chunks using ${chunkingStrategy} strategy`);
    if (chunks.length === 0) {
        console.log('No chunks to process, skipping');
        return;
    }
    // Generate embeddings for all chunks
    const texts = chunks.map(c => c.text);
    const embeddings = await (0, embeddings_1.embedTexts)(texts);
    console.log(`Generated ${embeddings.length} embeddings`);
    // Upsert to Pinecone
    await (0, pinecone_1.upsertChunks)(chunks, embeddings);
    console.log(`Upserted to Pinecone`);
    // Delete the S3 object (cleanup)
    await s3Client.send(new client_s3_1.DeleteObjectCommand({
        Bucket: bucket,
        Key: s3Key,
    }));
    console.log(`Deleted S3 object ${s3Key}`);
}
/**
 * Process a record from API-queued job
 */
async function processApiJob(job) {
    console.log(`Processing API job ${job.jobId} for document ${job.document.id}`);
    const strategy = job.chunkingStrategy || chunking_2.DEFAULT_CHUNKING_STRATEGY;
    await processDocument(BUCKET, job.s3Key, job.document.id, job.document.title, strategy);
}
/**
 * Process a record from S3 event
 */
async function processS3Event(s3Event) {
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
async function processRecord(record) {
    const body = JSON.parse(record.body);
    if (isS3EventRecord(body)) {
        // S3 event notification wrapped in SQS
        await processS3Event(body);
    }
    else {
        // API-queued job
        await processApiJob(body);
    }
}
/**
 * Lambda handler for SQS events
 */
async function handler(event, context) {
    console.log(`Processing ${event.Records.length} SQS records`);
    for (const record of event.Records) {
        try {
            await processRecord(record);
        }
        catch (error) {
            console.error(`Error processing record:`, error);
            // Re-throw to let SQS retry via redrive policy
            throw error;
        }
    }
    console.log('All records processed successfully');
}
//# sourceMappingURL=ingest-worker.js.map