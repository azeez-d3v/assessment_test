/**
 * Chunking configuration constants
 * Shared between service and tests for consistency
 */

/** Maximum characters per chunk (~300-400 tokens for text-embedding-3-small) */
export const CHUNK_SIZE = 1200;

/** Minimum characters before merging small fragments */
export const MIN_CHARS_PER_CHUNK = 50;
