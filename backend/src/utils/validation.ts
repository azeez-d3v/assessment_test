/**
 * Input validation using Zod
 */

import { z } from 'zod';

// Document schema
export const DocumentSchema = z.object({
    id: z.string().min(1, 'Document id is required'),
    title: z.string().min(1, 'Document title is required'),
    content: z.string().min(1, 'Document content is required'),
});

// Ingest request schema
export const IngestRequestSchema = z.object({
    documents: z.array(DocumentSchema).min(1, 'At least one document is required'),
});

// Ask request schema
export const AskRequestSchema = z.object({
    question: z.string().min(1, 'Question is required'),
    topK: z.number().int().positive().max(10).optional().default(3),
});

// Type exports from schemas
export type ValidatedDocument = z.infer<typeof DocumentSchema>;
export type ValidatedIngestRequest = z.infer<typeof IngestRequestSchema>;
export type ValidatedAskRequest = z.infer<typeof AskRequestSchema>;

/**
 * Validate ingest request body
 */
export function validateIngestRequest(body: unknown): ValidatedIngestRequest {
    return IngestRequestSchema.parse(body);
}

/**
 * Validate ask request body
 */
export function validateAskRequest(body: unknown): ValidatedAskRequest {
    return AskRequestSchema.parse(body);
}
