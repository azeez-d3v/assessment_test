/**
 * TypeScript interfaces for the Doc Q&A Portal
 */
export interface Document {
    id: string;
    title: string;
    content: string;
}
export interface Chunk {
    id: string;
    text: string;
    index: number;
    docId: string;
    title: string;
    chunkingStrategy?: string;
}
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
export interface AskRequest {
    question: string;
    messages?: Message[];
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
export interface VectorMetadata {
    docId: string;
    title: string;
    chunkText: string;
    chunkIndex: number;
    chunkingStrategy?: string;
}
export interface RetrievedChunk {
    id: string;
    score: number;
    metadata: VectorMetadata;
}
//# sourceMappingURL=index.d.ts.map