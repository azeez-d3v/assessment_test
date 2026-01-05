/**
 * Chunking configuration constants
 * Shared between service and tests for consistency
 */

// Recursive chunking (chonkiejs)
/** Maximum characters per chunk (~300-400 tokens for text-embedding-3-small) */
export const CHUNK_SIZE = 1200;
/** Minimum characters before merging small fragments */
export const MIN_CHARS_PER_CHUNK = 50;

// Fixed-size chunking
/** Fixed chunk size in characters */
export const FIXED_CHUNK_SIZE = 500;
/** Overlap between consecutive chunks */
export const FIXED_CHUNK_OVERLAP = 50;

// Strategy type
export type ChunkingStrategy = 'fixed' | 'recursive';
export const DEFAULT_CHUNKING_STRATEGY: ChunkingStrategy = 'recursive';
