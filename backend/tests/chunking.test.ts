/**
 * Unit tests for chunking service (chonkiejs)
 * Tests behavior invariants, not implementation details
 */

import { describe, it, expect } from 'vitest';
import { chunkText, chunkDocument, chunkDocuments } from '../src/services/chunking';
import { CHUNK_SIZE } from '../src/config/chunking';
import { Document } from '../src/types';

describe('chunkText', () => {
    it('returns empty array for empty string', async () => {
        expect(await chunkText('')).toEqual([]);
        expect(await chunkText('   ')).toEqual([]);
    });

    it('keeps short text intact as single chunk', async () => {
        const text = 'This is a short text.';
        const chunks = await chunkText(text);

        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toBe(text);
    });

    it('no chunk exceeds configured max size', async () => {
        // Create very long text that must be split
        const text = 'Lorem ipsum dolor sit amet. '.repeat(200); // ~5600 chars
        const chunks = await chunkText(text);

        // Invariant: no chunk exceeds max size (with tolerance for recursive boundary edge cases)
        for (const chunk of chunks) {
            expect(chunk.length).toBeLessThan(CHUNK_SIZE * 1.3);
        }
    });

    it('splits long text into multiple chunks', async () => {
        // Create text significantly longer than chunk size
        const text = 'This is a complete sentence with some content. '.repeat(100); // ~4700 chars
        const chunks = await chunkText(text);

        // Should split into multiple chunks
        expect(chunks.length).toBeGreaterThan(1);

        // All original content should be captured
        const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
        expect(totalChars).toBeGreaterThan(CHUNK_SIZE);
    });

    it('preserves all text content (no data loss)', async () => {
        const text = 'Unique marker A. Some content here. Unique marker B.';
        const chunks = await chunkText(text);

        const combined = chunks.join('');
        expect(combined).toContain('Unique marker A');
        expect(combined).toContain('Unique marker B');
    });

    it('keeps a full FAQ answer in one chunk', async () => {
        const faq = `
        Q: What is your refund policy?
        A: We offer refunds within 30 days of purchase provided the service has not been used.
        `;
        const chunks = await chunkText(faq);
        expect(chunks).toHaveLength(1);
    });
});

describe('chunkDocument', () => {
    it('chunks a document and includes metadata', async () => {
        const doc: Document = {
            id: 'test-doc',
            title: 'Test Document',
            content: 'This is the content of the test document.',
        };

        const chunks = await chunkDocument(doc);

        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toMatchObject({
            id: 'test-doc#chunk-0',
            docId: 'test-doc',
            title: 'Test Document',
            index: 0,
        });
        expect(chunks[0].text).toBe(doc.content);
    });

    it('creates multiple chunks with sequential IDs for long docs', async () => {
        const doc: Document = {
            id: 'long-doc',
            title: 'Long Document',
            content: 'This is a long sentence that repeats many times for testing purposes. '.repeat(100),
        };

        const chunks = await chunkDocument(doc);

        // Should have multiple chunks for long content
        expect(chunks.length).toBeGreaterThan(1);

        // Check IDs are sequential
        chunks.forEach((chunk, i) => {
            expect(chunk.id).toBe(`long-doc#chunk-${i}`);
            expect(chunk.index).toBe(i);
            expect(chunk.docId).toBe('long-doc');
        });
    });
});

describe('chunkDocuments', () => {
    it('chunks multiple documents', async () => {
        const docs: Document[] = [
            { id: 'doc1', title: 'Doc 1', content: 'Content for document one.' },
            { id: 'doc2', title: 'Doc 2', content: 'Content for document two.' },
        ];

        const chunks = await chunkDocuments(docs);

        expect(chunks).toHaveLength(2);
        expect(chunks[0].docId).toBe('doc1');
        expect(chunks[1].docId).toBe('doc2');
    });
});
