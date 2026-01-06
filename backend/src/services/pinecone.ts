/**
 * Pinecone vector store service
 * Handles upsert and query operations
 */

import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import { Chunk, VectorMetadata, RetrievedChunk } from '../types';

// Initialize client lazily
let pineconeClient: Pinecone | null = null;

function getClient(): Pinecone {
    if (!pineconeClient) {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error('PINECONE_API_KEY environment variable is required');
        }
        pineconeClient = new Pinecone({ apiKey });
    }
    return pineconeClient;
}

function getIndexName(): string {
    const indexName = process.env.PINECONE_INDEX;
    if (!indexName) {
        throw new Error('PINECONE_INDEX environment variable is required');
    }
    return indexName;
}

/**
 * Check if any documents exist in the index using describeIndexStats
 * This is an O(1) operation - much more efficient than listing documents
 */
export async function hasDocuments(): Promise<boolean> {
    const client = getClient();
    const index = client.index(getIndexName());
    const stats = await index.describeIndexStats();
    return (stats.totalRecordCount ?? 0) > 0;
}

/**
 * Upsert chunks with their embeddings to Pinecone
 */
export async function upsertChunks(
    chunks: Chunk[],
    embeddings: number[][]
): Promise<number> {
    if (chunks.length === 0 || chunks.length !== embeddings.length) {
        throw new Error('Chunks and embeddings must have matching non-zero length');
    }

    const client = getClient();
    const index = client.index(getIndexName());

    // Prepare vectors for upsert
    const vectors = chunks.map((chunk, i) => ({
        id: chunk.id,
        values: embeddings[i],
        metadata: {
            docId: chunk.docId,
            title: chunk.title,
            chunkText: chunk.text,
            chunkIndex: chunk.index,
            chunkingStrategy: chunk.chunkingStrategy,
            extractionMethod: chunk.extractionMethod,
        } as RecordMetadata,
    }));

    // Upsert in batches of 100 (Pinecone limit)
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
    }

    return vectors.length;
}

/**
 * Query Pinecone for similar vectors
 */
export async function queryByVector(
    vector: number[],
    topK: number = 3
): Promise<RetrievedChunk[]> {
    const client = getClient();
    const index = client.index(getIndexName());

    const results = await index.query({
        vector,
        topK,
        includeMetadata: true,
    });

    if (!results.matches) {
        return [];
    }

    return results.matches.map(match => ({
        id: match.id,
        score: match.score ?? 0,
        metadata: match.metadata as unknown as VectorMetadata,
    }));
}

/**
 * Delete all vectors for a specific document by listing and deleting by IDs
 */
export async function deleteByDocId(docId: string): Promise<number> {
    const client = getClient();
    const index = client.index(getIndexName());

    // List all vector IDs with this document prefix
    const prefix = `${docId}#`;
    const idsToDelete: string[] = [];

    let paginationToken: string | undefined;
    do {
        const result = await index.listPaginated({ prefix, limit: 100, paginationToken });
        if (result.vectors) {
            idsToDelete.push(...result.vectors.map(v => v.id).filter((id): id is string => !!id));
        }
        paginationToken = result.pagination?.next;
    } while (paginationToken);

    if (idsToDelete.length > 0) {
        await index.deleteMany(idsToDelete);
    }

    return idsToDelete.length;
}

/**
 * List all unique documents in the index
 */
export interface DocumentInfo {
    docId: string;
    title: string;
    chunkCount: number;
    chunkingStrategy?: string;
    extractionMethod?: string;
}

export async function listDocuments(): Promise<DocumentInfo[]> {
    const client = getClient();
    const index = client.index(getIndexName());

    // List all vector IDs
    const allIds: string[] = [];
    let paginationToken: string | undefined;

    do {
        const result = await index.listPaginated({ limit: 100, paginationToken });
        if (result.vectors) {
            allIds.push(...result.vectors.map(v => v.id).filter((id): id is string => !!id));
        }
        paginationToken = result.pagination?.next;
    } while (paginationToken);

    if (allIds.length === 0) {
        return [];
    }

    // Batch fetch all vectors at once (in chunks of 100 to respect API limits)
    // This fixes the N+1 query problem - we now fetch all vectors in batches
    // instead of fetching one at a time for each unique document
    const allRecords: Record<string, { metadata?: RecordMetadata }> = {};
    for (let i = 0; i < allIds.length; i += 100) {
        const batch = allIds.slice(i, i + 100);
        const fetchResult = await index.fetch(batch);
        Object.assign(allRecords, fetchResult.records);
    }

    // Group by document ID and extract metadata from fetched records
    const docMap = new Map<string, { title: string; count: number; chunkingStrategy?: string; extractionMethod?: string }>();

    for (const id of allIds) {
        const [docId] = id.split('#');
        if (!docMap.has(docId)) {
            // Get metadata from already-fetched records (no additional API calls!)
            const record = allRecords[id];
            const title = (record?.metadata?.title as string) || docId;
            const chunkingStrategy = record?.metadata?.chunkingStrategy as string | undefined;
            const extractionMethod = record?.metadata?.extractionMethod as string | undefined;
            docMap.set(docId, { title, count: 1, chunkingStrategy, extractionMethod });
        } else {
            const doc = docMap.get(docId)!;
            doc.count++;
        }
    }

    return Array.from(docMap.entries()).map(([docId, info]) => ({
        docId,
        title: info.title,
        chunkCount: info.count,
        chunkingStrategy: info.chunkingStrategy,
        extractionMethod: info.extractionMethod,
    }));
}

/**
 * Get the content of a document by combining all its chunks
 */
export async function getDocumentContent(docId: string): Promise<{ title: string; content: string } | null> {
    const client = getClient();
    const index = client.index(getIndexName());

    // List all vectors for this document
    const vectorIds: string[] = [];
    let paginationToken: string | undefined;

    do {
        const result = await index.listPaginated({ prefix: docId, limit: 100, paginationToken });
        if (result.vectors) {
            vectorIds.push(...result.vectors.map(v => v.id).filter((id): id is string => !!id));
        }
        paginationToken = result.pagination?.next;
    } while (paginationToken);

    if (vectorIds.length === 0) {
        return null;
    }

    // Fetch all vectors to get their metadata
    const fetchResult = await index.fetch(vectorIds);

    // Collect chunks with their indices
    const chunks: Array<{ index: number; text: string; title: string }> = [];

    for (const id of vectorIds) {
        const record = fetchResult.records[id];
        if (record?.metadata) {
            const chunkIndex = parseInt(id.split('#chunk-')[1] || '0');
            chunks.push({
                index: chunkIndex,
                text: record.metadata.chunkText as string || '',
                title: record.metadata.title as string || docId,
            });
        }
    }

    // Sort by chunk index and combine
    chunks.sort((a, b) => a.index - b.index);
    const content = chunks.map(c => c.text).join('\n\n');
    const title = chunks[0]?.title || docId;

    return { title, content };
}
