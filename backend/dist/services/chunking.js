"use strict";
/**
 * Text chunking service - supports multiple strategies
 *
 * Strategies:
 * - 'recursive': chonkiejs hierarchical (paragraphs → sentences → words)
 * - 'fixed': Fixed-size chunks with overlap
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkText = chunkText;
exports.chunkDocument = chunkDocument;
exports.chunkDocuments = chunkDocuments;
const core_1 = require("@chonkiejs/core");
const chunking_1 = require("../config/chunking");
const chunking_fixed_1 = require("./chunking-fixed");
// Lazy-loaded chunker instance for recursive strategy
let chunkerInstance = null;
async function getRecursiveChunker() {
    if (!chunkerInstance) {
        chunkerInstance = await core_1.RecursiveChunker.create({
            chunkSize: chunking_1.CHUNK_SIZE,
            minCharactersPerChunk: chunking_1.MIN_CHARS_PER_CHUNK
        });
    }
    return chunkerInstance;
}
/**
 * Split text into chunks using recursive structural strategy
 */
async function chunkTextRecursive(text) {
    if (!text || text.trim().length === 0) {
        return [];
    }
    const chunker = await getRecursiveChunker();
    const chunks = await chunker.chunk(text);
    return chunks
        .map(c => c.text.trim())
        .filter(Boolean);
}
/**
 * Split text into chunks using the specified strategy
 */
async function chunkText(text, strategy = chunking_1.DEFAULT_CHUNKING_STRATEGY) {
    if (strategy === 'fixed') {
        return (0, chunking_fixed_1.chunkTextFixed)(text);
    }
    return chunkTextRecursive(text);
}
/**
 * Chunk a document using the specified strategy
 */
async function chunkDocument(document, strategy = chunking_1.DEFAULT_CHUNKING_STRATEGY) {
    if (strategy === 'fixed') {
        return (0, chunking_fixed_1.chunkDocumentFixed)(document);
    }
    const textChunks = await chunkTextRecursive(document.content);
    return textChunks.map((text, index) => ({
        id: `${document.id}#chunk-${index}`,
        text,
        index,
        docId: document.id,
        title: document.title,
        chunkingStrategy: 'recursive',
    }));
}
/**
 * Chunk multiple documents using the specified strategy
 */
async function chunkDocuments(documents, strategy = chunking_1.DEFAULT_CHUNKING_STRATEGY) {
    const results = await Promise.all(documents.map(doc => chunkDocument(doc, strategy)));
    return results.flat();
}
//# sourceMappingURL=chunking.js.map