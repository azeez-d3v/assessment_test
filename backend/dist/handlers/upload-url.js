"use strict";
/**
 * Lambda handler for GET /upload-url
 * Generates presigned S3 URLs for direct file uploads
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const response_1 = require("../utils/response");
const crypto_1 = require("crypto");
const chunking_1 = require("../config/chunking");
const s3Client = new client_s3_1.S3Client({});
const BUCKET = process.env.DOC_BUCKET || '';
// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx'];
// Content type mapping
const CONTENT_TYPES = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
/**
 * Extract file extension from filename
 */
function getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(lastDot).toLowerCase() : '';
}
/**
 * Generate document ID and title from filename
 */
function parseFilename(filename) {
    const baseName = filename.replace(/\.(txt|md|pdf|docx)$/i, '');
    const docId = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return {
        docId: docId || 'document',
        title: baseName || 'Untitled',
    };
}
/**
 * Lambda handler
 */
async function handler(event) {
    try {
        // Get filename from query parameters
        const filename = event.queryStringParameters?.filename;
        if (!filename) {
            return (0, response_1.createResponse)(400, { error: 'filename query parameter is required' });
        }
        // Validate file extension
        const ext = getFileExtension(filename);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return (0, response_1.createResponse)(400, {
                error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
            });
        }
        // Check if S3 bucket is configured
        if (!BUCKET) {
            return (0, response_1.createResponse)(500, { error: 'S3 bucket not configured' });
        }
        // Generate unique S3 key
        const uploadId = (0, crypto_1.randomUUID)();
        const { docId, title } = parseFilename(filename);
        const s3Key = `uploads/${uploadId}/${filename}`;
        // Get chunking strategy from query params (default: recursive)
        const strategyParam = event.queryStringParameters?.chunkingStrategy;
        const chunkingStrategy = (strategyParam === 'fixed' || strategyParam === 'recursive')
            ? strategyParam
            : chunking_1.DEFAULT_CHUNKING_STRATEGY;
        // Generate presigned URL (5-minute expiry)
        const command = new client_s3_1.PutObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
            ContentType: CONTENT_TYPES[ext] || 'application/octet-stream',
            Metadata: {
                'doc-id': docId,
                'doc-title': title,
                'original-filename': filename,
                'chunking-strategy': chunkingStrategy, // Store strategy for worker
            },
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 300 });
        return (0, response_1.createResponse)(200, {
            uploadUrl,
            s3Key,
            docId,
            title,
            chunkingStrategy,
            expiresIn: 300,
        });
    }
    catch (error) {
        console.error('Upload URL error:', error);
        return (0, response_1.createResponse)(500, {
            error: 'Failed to generate upload URL',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=upload-url.js.map