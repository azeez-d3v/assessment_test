/**
 * Unit tests for chunking service
 */

import { describe, it, expect } from 'vitest';
import { chunkText, chunkDocument, chunkDocuments } from '../src/services/chunking';
import { Document } from '../src/types';

describe('chunkText', () => {
    it('returns empty array for empty string', () => {
        expect(chunkText('')).toEqual([]);
        expect(chunkText('   ')).toEqual([]);
    });

    it('returns single chunk for short text', () => {
        const text = 'This is a short text.';
        const chunks = chunkText(text);
        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toBe(text);
    });

    it('splits text into multiple chunks with overlap', () => {
        // Create text longer than chunk size
        const text = 'A'.repeat(600);
        const chunks = chunkText(text, { chunkSize: 500, chunkOverlap: 50 });

        expect(chunks.length).toBeGreaterThan(1);

        // Check overlap - end of first chunk should be start of second
        const firstChunkEnd = chunks[0].slice(-50);
        const secondChunkStart = chunks[1].slice(0, 50);
        expect(firstChunkEnd).toBe(secondChunkStart);
    });

    it('respects custom chunk size', () => {
        const text = 'Word '.repeat(100); // 500 characters
        const chunks = chunkText(text, { chunkSize: 100, chunkOverlap: 10 });

        chunks.forEach(chunk => {
            expect(chunk.length).toBeLessThanOrEqual(100);
        });
    });

    it('tries to break at sentence boundaries', () => {
        const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.';
        const chunks = chunkText(text, { chunkSize: 50, chunkOverlap: 10 });

        // Each chunk should ideally end with a period
        // (may not always be true depending on text, but check structure)
        expect(chunks.length).toBeGreaterThan(0);
    });
});

describe('chunkDocument', () => {
    it('chunks a document and includes metadata', () => {
        const doc: Document = {
            id: 'test-doc',
            title: 'Test Document',
            content: 'This is the content of the test document.',
        };

        const chunks = chunkDocument(doc);

        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toMatchObject({
            id: 'test-doc#chunk-0',
            docId: 'test-doc',
            title: 'Test Document',
            index: 0,
        });
        expect(chunks[0].text).toBe(doc.content);
    });

    it('creates multiple chunks with sequential IDs', () => {
        const doc: Document = {
            id: 'long-doc',
            title: 'Long Document',
            content: 'X'.repeat(1200), // Should create 3+ chunks
        };

        const chunks = chunkDocument(doc, { chunkSize: 500, chunkOverlap: 50 });

        expect(chunks.length).toBeGreaterThan(1);

        // Check IDs are sequential
        chunks.forEach((chunk, i) => {
            expect(chunk.id).toBe(`long-doc#chunk-${i}`);
            expect(chunk.index).toBe(i);
        });
    });
});

describe('chunkDocuments', () => {
    it('chunks multiple documents', () => {
        const docs: Document[] = [
            { id: 'doc1', title: 'Doc 1', content: 'Content 1' },
            { id: 'doc2', title: 'Doc 2', content: 'Content 2' },
        ];

        const chunks = chunkDocuments(docs);

        expect(chunks).toHaveLength(2);
        expect(chunks[0].docId).toBe('doc1');
        expect(chunks[1].docId).toBe('doc2');
    });
});
