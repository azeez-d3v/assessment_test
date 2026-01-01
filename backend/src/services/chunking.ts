/**
 * Text chunking service
 * Strategy: Fixed-size chunks with overlap for context preservation
 */

import { Chunk, Document } from '../types';

export interface ChunkingOptions {
  chunkSize: number;    // Max characters per chunk
  chunkOverlap: number; // Overlap between consecutive chunks
}

const DEFAULT_OPTIONS: ChunkingOptions = {
  chunkSize: 500,
  chunkOverlap: 50,
};

/**
 * Split text into overlapping chunks
 */
export function chunkText(
  text: string,
  options: Partial<ChunkingOptions> = {}
): string[] {
  const { chunkSize, chunkOverlap } = { ...DEFAULT_OPTIONS, ...options };

  // Validate: overlap must be less than chunk size to prevent infinite loop
  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be less than chunkSize to prevent infinite loop');
  }

  if (!text || text.trim().length === 0) {
    return [];
  }

  // If text is smaller than chunk size, return as single chunk
  if (text.length <= chunkSize) {
    return [text.trim()];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // If not at the end, try to break at a sentence boundary
    if (endIndex < text.length) {
      const searchWindow = text.slice(startIndex, endIndex);

      // Look for sentence boundaries (., !, ?) near the end
      const lastPeriod = searchWindow.lastIndexOf('. ');
      const lastExclaim = searchWindow.lastIndexOf('! ');
      const lastQuestion = searchWindow.lastIndexOf('? ');
      const lastNewline = searchWindow.lastIndexOf('\n');

      // Find the latest sentence boundary in the last 20% of the chunk
      const minBoundary = Math.floor(chunkSize * 0.8);
      const boundaries = [lastPeriod, lastExclaim, lastQuestion, lastNewline]
        .filter(pos => pos >= minBoundary);

      if (boundaries.length > 0) {
        const bestBoundary = Math.max(...boundaries);
        endIndex = startIndex + bestBoundary + 1; // Include the boundary char
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start, accounting for overlap
    startIndex = endIndex - chunkOverlap;

    // Prevent infinite loop if overlap >= chunk extracted
    if (startIndex >= text.length - 1) break;
  }

  return chunks;
}

/**
 * Chunk a document and return Chunk objects with metadata
 */
export function chunkDocument(
  document: Document,
  options: Partial<ChunkingOptions> = {}
): Chunk[] {
  const textChunks = chunkText(document.content, options);

  return textChunks.map((text, index) => ({
    id: `${document.id}#chunk-${index}`,
    text,
    index,
    docId: document.id,
    title: document.title,
  }));
}

/**
 * Chunk multiple documents
 */
export function chunkDocuments(
  documents: Document[],
  options: Partial<ChunkingOptions> = {}
): Chunk[] {
  return documents.flatMap(doc => chunkDocument(doc, options));
}
