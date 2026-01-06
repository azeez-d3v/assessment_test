"use strict";
/**
 * Lambda handler for POST /ask
 * Answers questions using RAG: embed → query Pinecone → LLM
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
const validation_1 = require("../utils/validation");
const response_1 = require("../utils/response");
const embeddings_1 = require("../services/embeddings");
const pinecone_1 = require("../services/pinecone");
const llm_1 = require("../services/llm");
const z = __importStar(require("zod"));
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
        const request = (0, validation_1.validateAskRequest)(parsedBody);
        // Check if any documents exist in the index
        const documentsExist = await (0, pinecone_1.hasDocuments)();
        // If no documents exist, skip embedding/query and let LLM handle with empty chunks
        // This allows greetings to still work while substantive questions get declined
        let retrievedChunks = [];
        if (documentsExist) {
            // Embed the question
            const questionEmbedding = await (0, embeddings_1.embedText)(request.question);
            // Query Pinecone for similar chunks
            retrievedChunks = await (0, pinecone_1.queryByVector)(questionEmbedding, request.topK);
        }
        // Dynamic threshold: filter within 30% of top score, with floor of 0.25
        // This adapts to query complexity - strict for clear matches, lenient for multi-topic
        const topScore = retrievedChunks.length > 0
            ? Math.max(...retrievedChunks.map(c => c.score))
            : 0;
        const dynamicThreshold = Math.max(topScore * 0.7, 0.25);
        const relevantChunks = retrievedChunks.filter(chunk => chunk.score >= dynamicThreshold);
        // Generate answer using LLM with ONLY relevant chunks (more efficient, cleaner context)
        const answer = await (0, llm_1.answerWithContext)(request.question, relevantChunks, request.messages);
        // Deduplicate sources (same doc might appear in multiple chunks)
        const sourceMap = new Map();
        for (const chunk of relevantChunks) {
            if (!sourceMap.has(chunk.metadata.docId)) {
                sourceMap.set(chunk.metadata.docId, {
                    docId: chunk.metadata.docId,
                    title: chunk.metadata.title,
                });
            }
        }
        const response = {
            answer,
            sources: Array.from(sourceMap.values()),
        };
        return (0, response_1.createResponse)(200, response);
    }
    catch (error) {
        console.error('Ask error:', error);
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
//# sourceMappingURL=ask.js.map