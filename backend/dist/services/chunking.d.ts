/**
 * Text chunking service - supports multiple strategies
 *
 * Strategies:
 * - 'recursive': chonkiejs hierarchical (paragraphs → sentences → words)
 * - 'fixed': Fixed-size chunks with overlap
 */
import { Chunk, Document } from '../types';
import { ChunkingStrategy } from '../config/chunking';
/**
 * Split text into chunks using the specified strategy
 */
export declare function chunkText(text: string, strategy?: ChunkingStrategy): Promise<string[]>;
/**
 * Chunk a document using the specified strategy
 */
export declare function chunkDocument(document: Document, strategy?: ChunkingStrategy): Promise<Chunk[]>;
/**
 * Chunk multiple documents using the specified strategy
 */
export declare function chunkDocuments(documents: Document[], strategy?: ChunkingStrategy): Promise<Chunk[]>;
//# sourceMappingURL=chunking.d.ts.map