/**
 * Text chunking service using chonkiejs
 * 
 * Strategy: Recursive structural chunking
 * Attempts higher-level boundaries (paragraphs, sentences) before
 * falling back to smaller units when chunks exceed the target size.
 */

import { RecursiveChunker } from '@chonkiejs/core';
import { Chunk, Document } from '../types';
import { CHUNK_SIZE, MIN_CHARS_PER_CHUNK } from '../config/chunking';

// Lazy-loaded chunker instance (async initialization)
let chunkerInstance: RecursiveChunker | null = null;

async function getChunker(): Promise<RecursiveChunker> {
  if (!chunkerInstance) {
    // Use factory method as per chonkiejs docs
    chunkerInstance = await RecursiveChunker.create({
      chunkSize: CHUNK_SIZE,
      minCharactersPerChunk: MIN_CHARS_PER_CHUNK
    });
  }
  return chunkerInstance;
}

/**
 * Split text into chunks using recursive structural strategy
 * Hierarchy: paragraphs → sentences → punctuation → words → characters
 */
export async function chunkText(text: string): Promise<string[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunker = await getChunker();
  const chunks = await chunker.chunk(text);

  // Filter out empty/whitespace chunks (defensive)
  return chunks
    .map(c => c.text.trim())
    .filter(Boolean);
}

/**
 * Chunk a document and return Chunk objects with metadata
 */
export async function chunkDocument(document: Document): Promise<Chunk[]> {
  const textChunks = await chunkText(document.content);

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
export async function chunkDocuments(documents: Document[]): Promise<Chunk[]> {
  const results = await Promise.all(
    documents.map(doc => chunkDocument(doc))
  );
  return results.flat();
}
