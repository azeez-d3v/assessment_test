"use strict";
/**
 * Input validation using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AskRequestSchema = exports.MessageSchema = exports.IngestRequestSchema = exports.ChunkingStrategySchema = exports.DocumentSchema = void 0;
exports.validateIngestRequest = validateIngestRequest;
exports.validateAskRequest = validateAskRequest;
const zod_1 = require("zod");
// Document schema
exports.DocumentSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Document id is required'),
    title: zod_1.z.string().min(1, 'Document title is required'),
    content: zod_1.z.string().min(1, 'Document content is required'),
});
// Chunking strategy enum
exports.ChunkingStrategySchema = zod_1.z.enum(['fixed', 'recursive']);
// Ingest request schema
exports.IngestRequestSchema = zod_1.z.object({
    documents: zod_1.z.array(exports.DocumentSchema).min(1, 'At least one document is required'),
    chunkingStrategy: exports.ChunkingStrategySchema.optional().default('recursive'),
});
// Message schema
exports.MessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'assistant', 'system']),
    content: zod_1.z.string(),
});
// Ask request schema
exports.AskRequestSchema = zod_1.z.object({
    question: zod_1.z.string().min(1, 'Question is required'),
    messages: zod_1.z.array(exports.MessageSchema).optional(),
    topK: zod_1.z.number().int().positive().max(10).optional().default(3),
});
/**
 * Validate ingest request body
 */
function validateIngestRequest(body) {
    return exports.IngestRequestSchema.parse(body);
}
/**
 * Validate ask request body
 */
function validateAskRequest(body) {
    return exports.AskRequestSchema.parse(body);
}
//# sourceMappingURL=validation.js.map