/**
 * Text chunking service - supports multiple strategies
 * 
 * Strategies:
 * - 'recursive': chonkiejs hierarchical (paragraphs → sentences → words)
 * - 'fixed': Fixed-size chunks with overlap
 */

import { RecursiveChunker } from '@chonkiejs/core';
import { Chunk, Document } from '../types';
import {
  CHUNK_SIZE,
  MIN_CHARS_PER_CHUNK,
  ChunkingStrategy,
  DEFAULT_CHUNKING_STRATEGY
} from '../config/chunking';
import { chunkTextFixed, chunkDocumentFixed } from './chunking-fixed';

// Lazy-loaded chunker instance for recursive strategy
let chunkerInstance: RecursiveChunker | null = null;

async function getRecursiveChunker(): Promise<RecursiveChunker> {
  if (!chunkerInstance) {
    chunkerInstance = await RecursiveChunker.create({
      chunkSize: CHUNK_SIZE,
      minCharactersPerChunk: MIN_CHARS_PER_CHUNK
    });
  }
  return chunkerInstance;
}

/**
 * Split text into chunks using recursive structural strategy
 */
async function chunkTextRecursive(text: string): Promise<string[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunker = await getRecursiveChunker();
  const chunks = await chunker.chunk(text);

  return chunks
    .map(c => c.text.trim())
    .filter(Boolean);
}

/**
 * Split text into chunks using the specified strategy
 */
export async function chunkText(
  text: string,
  strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY
): Promise<string[]> {
  if (strategy === 'fixed') {
    return chunkTextFixed(text);
  }
  return chunkTextRecursive(text);
}

/**
 * Chunk a document using the specified strategy
 */
export async function chunkDocument(
  document: Document,
  strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY
): Promise<Chunk[]> {
  if (strategy === 'fixed') {
    return chunkDocumentFixed(document);
  }

  const textChunks = await chunkTextRecursive(document.content);
  return textChunks.map((text, index) => ({
    id: `${document.id}#chunk-${index}`,
    text,
    index,
    docId: document.id,
    title: document.title,
    chunkingStrategy: 'recursive',
  }));
}

/**
 * Chunk multiple documents using the specified strategy
 */
export async function chunkDocuments(
  documents: Document[],
  strategy: ChunkingStrategy = DEFAULT_CHUNKING_STRATEGY
): Promise<Chunk[]> {
  const results = await Promise.all(
    documents.map(doc => chunkDocument(doc, strategy))
  );
  return results.flat();
}
