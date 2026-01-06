/**
 * TypeScript interfaces for the Doc Q&A Portal
 */

// Input document structure for ingestion
export interface Document {
    id: string;
    title: string;
    content: string;
}

// Chunked text with metadata
export interface Chunk {
    id: string;           // e.g., "doc-id#chunk-0"
    text: string;
    index: number;
    docId: string;
    title: string;
    chunkingStrategy?: string;
    extractionMethod?: string;
}

// Ingest endpoint
export interface IngestRequest {
    documents: Document[];
}

export interface IngestResponse {
    ingestedDocuments: number;
    ingestedChunks: number;
}


export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Ask endpoint
export interface AskRequest {
    question: string;
    messages?: Message[]; // Chat history
    topK?: number;
}

export interface Source {
    docId: string;
    title: string;
}

export interface AskResponse {
    answer: string;
    sources: Source[];
}

// Pinecone vector with metadata
export interface VectorMetadata {
    docId: string;
    title: string;
    chunkText: string;
    chunkIndex: number;
    chunkingStrategy?: string;
    extractionMethod?: string;
}

// Retrieved chunk from Pinecone query
export interface RetrievedChunk {
    id: string;
    score: number;
    metadata: VectorMetadata;
}
