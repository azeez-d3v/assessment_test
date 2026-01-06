/**
 * Pinecone vector store service
 * Handles upsert and query operations
 */
import { Chunk, RetrievedChunk } from '../types';
/**
 * Check if any documents exist in the index using describeIndexStats
 * This is an O(1) operation - much more efficient than listing documents
 */
export declare function hasDocuments(): Promise<boolean>;
/**
 * Upsert chunks with their embeddings to Pinecone
 */
export declare function upsertChunks(chunks: Chunk[], embeddings: number[][]): Promise<number>;
/**
 * Query Pinecone for similar vectors
 */
export declare function queryByVector(vector: number[], topK?: number): Promise<RetrievedChunk[]>;
/**
 * Delete all vectors for a specific document by listing and deleting by IDs
 */
export declare function deleteByDocId(docId: string): Promise<number>;
/**
 * List all unique documents in the index
 */
export interface DocumentInfo {
    docId: string;
    title: string;
    chunkCount: number;
}
export declare function listDocuments(): Promise<DocumentInfo[]>;
/**
 * Get the content of a document by combining all its chunks
 */
export declare function getDocumentContent(docId: string): Promise<{
    title: string;
    content: string;
} | null>;
//# sourceMappingURL=pinecone.d.ts.map