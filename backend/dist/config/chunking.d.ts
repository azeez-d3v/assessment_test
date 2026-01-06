/**
 * Chunking configuration constants
 * Shared between service and tests for consistency
 */
/** Maximum characters per chunk (~300-400 tokens for text-embedding-3-small) */
export declare const CHUNK_SIZE = 1200;
/** Minimum characters before merging small fragments */
export declare const MIN_CHARS_PER_CHUNK = 50;
/** Fixed chunk size in characters */
export declare const FIXED_CHUNK_SIZE = 500;
/** Overlap between consecutive chunks */
export declare const FIXED_CHUNK_OVERLAP = 50;
export type ChunkingStrategy = 'fixed' | 'recursive';
export declare const DEFAULT_CHUNKING_STRATEGY: ChunkingStrategy;
//# sourceMappingURL=chunking.d.ts.map