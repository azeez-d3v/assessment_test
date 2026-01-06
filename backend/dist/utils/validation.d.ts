/**
 * Input validation using Zod
 */
import { z } from 'zod';
export declare const DocumentSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    content: z.ZodString;
}, z.core.$strip>;
export declare const ChunkingStrategySchema: z.ZodEnum<{
    fixed: "fixed";
    recursive: "recursive";
}>;
export declare const IngestRequestSchema: z.ZodObject<{
    documents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
    }, z.core.$strip>>;
    chunkingStrategy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        fixed: "fixed";
        recursive: "recursive";
    }>>>;
}, z.core.$strip>;
export declare const MessageSchema: z.ZodObject<{
    role: z.ZodEnum<{
        user: "user";
        assistant: "assistant";
        system: "system";
    }>;
    content: z.ZodString;
}, z.core.$strip>;
export declare const AskRequestSchema: z.ZodObject<{
    question: z.ZodString;
    messages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
            system: "system";
        }>;
        content: z.ZodString;
    }, z.core.$strip>>>;
    topK: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type ValidatedDocument = z.infer<typeof DocumentSchema>;
export type ValidatedIngestRequest = z.infer<typeof IngestRequestSchema>;
export type ValidatedAskRequest = z.infer<typeof AskRequestSchema>;
/**
 * Validate ingest request body
 */
export declare function validateIngestRequest(body: unknown): ValidatedIngestRequest;
/**
 * Validate ask request body
 */
export declare function validateAskRequest(body: unknown): ValidatedAskRequest;
//# sourceMappingURL=validation.d.ts.map