"use strict";
/**
 * Chunking configuration constants
 * Shared between service and tests for consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CHUNKING_STRATEGY = exports.FIXED_CHUNK_OVERLAP = exports.FIXED_CHUNK_SIZE = exports.MIN_CHARS_PER_CHUNK = exports.CHUNK_SIZE = void 0;
// Recursive chunking (chonkiejs)
/** Maximum characters per chunk (~300-400 tokens for text-embedding-3-small) */
exports.CHUNK_SIZE = 1200;
/** Minimum characters before merging small fragments */
exports.MIN_CHARS_PER_CHUNK = 50;
// Fixed-size chunking
/** Fixed chunk size in characters */
exports.FIXED_CHUNK_SIZE = 500;
/** Overlap between consecutive chunks */
exports.FIXED_CHUNK_OVERLAP = 50;
exports.DEFAULT_CHUNKING_STRATEGY = 'recursive';
//# sourceMappingURL=chunking.js.map