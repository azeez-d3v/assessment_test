/**
 * Lambda handler for GET /upload-url
 * Generates presigned S3 URLs for direct file uploads
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createResponse } from '../utils/response';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({});
const BUCKET = process.env.DOC_BUCKET || '';

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.txt', '.md', '.pdf', '.docx'];

// Content type mapping
const CONTENT_TYPES: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Extract file extension from filename
 */
function getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot >= 0 ? filename.substring(lastDot).toLowerCase() : '';
}

/**
 * Generate document ID and title from filename
 */
function parseFilename(filename: string): { docId: string; title: string } {
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
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        // Get filename from query parameters
        const filename = event.queryStringParameters?.filename;

        if (!filename) {
            return createResponse(400, { error: 'filename query parameter is required' });
        }

        // Validate file extension
        const ext = getFileExtension(filename);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return createResponse(400, {
                error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
            });
        }

        // Check if S3 bucket is configured
        if (!BUCKET) {
            return createResponse(500, { error: 'S3 bucket not configured' });
        }

        // Generate unique S3 key
        const uploadId = randomUUID();
        const { docId, title } = parseFilename(filename);
        const s3Key = `uploads/${uploadId}/${filename}`;

        // Generate presigned URL (5-minute expiry)
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: s3Key,
            ContentType: CONTENT_TYPES[ext] || 'application/octet-stream',
            Metadata: {
                'doc-id': docId,
                'doc-title': title,
                'original-filename': filename,
            },
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        return createResponse(200, {
            uploadUrl,
            s3Key,
            docId,
            title,
            expiresIn: 300,
        });

    } catch (error) {
        console.error('Upload URL error:', error);
        return createResponse(500, {
            error: 'Failed to generate upload URL',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
