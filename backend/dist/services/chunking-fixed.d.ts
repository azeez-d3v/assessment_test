/**
 * Fixed-size text chunking service
 * Strategy: Fixed-size chunks with overlap for context preservation
 */
import { Chunk, Document } from '../types';
/**
 * Split text into overlapping fixed-size chunks
 */
export declare function chunkTextFixed(text: string, chunkSize?: number, chunkOverlap?: number): string[];
/**
 * Chunk a document using fixed-size strategy
 */
export declare function chunkDocumentFixed(document: Document): Chunk[];
//# sourceMappingURL=chunking-fixed.d.ts.map