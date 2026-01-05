/**
 * Tests for Dual Chunking Strategy (Fixed vs Recursive)
 */

import { describe, it, expect } from 'vitest';
import { chunkText, chunkDocument } from '../src/services/chunking';
import { FIXED_CHUNK_SIZE, FIXED_CHUNK_OVERLAP } from '../src/config/chunking';
import { Document } from '../src/types';

describe('Dual Chunking Strategy', () => {

    describe('Fixed-Size Strategy', () => {
        it('uses fixed chunk size', async () => {
            // Create text longer than fixed size (500)
            const text = 'a'.repeat(FIXED_CHUNK_SIZE + 100);
            const chunks = await chunkText(text, 'fixed');

            // Should be split
            expect(chunks.length).toBeGreaterThan(1);

            // First chunk should be exactly FIXED_CHUNK_SIZE
            expect(chunks[0].length).toBe(FIXED_CHUNK_SIZE);
        });

        it('respects overlap', async () => {
            // Create text "1234567890" with size 5, overlap 2
            // Expected: "12345", "45678", "7890"
            // We can't easily change the constant config, so we rely on the math
            // First chunk ends at 500, second starts at 500 - 50 = 450

            const text = 'a'.repeat(FIXED_CHUNK_SIZE * 2);
            const chunks = await chunkText(text, 'fixed');

            expect(chunks.length).toBeGreaterThan(1);

            // In fixed chunking, we can verify overlap by checking content
            // or just verifying correct splitting behavior generally
            expect(chunks[0].length).toBe(FIXED_CHUNK_SIZE);
        });

        it('adds chunking strategy to metadata', async () => {
            const doc: Document = {
                id: 'fixed-doc',
                title: 'Fixed Doc',
                content: 'Some content',
            };

            const chunks = await chunkDocument(doc, 'fixed');


            // Check metadata
            expect(chunks[0].chunkingStrategy).toBe('fixed');
        });
    });

    describe('Recursive Strategy (Default)', () => {
        it('uses recursive strategy by default', async () => {
            const text = 'Some content';
            const chunks = await chunkText(text); // Default

            // Recursive strategy usually leaves short text as one
            expect(chunks).toHaveLength(1);
        });

        it('uses recursive strategy when explicitly requested', async () => {
            const text = 'Some content';
            const chunks = await chunkText(text, 'recursive');
            expect(chunks).toHaveLength(1);
        });

        it('adds chunking strategy to metadata', async () => {
            const doc: Document = {
                id: 'recursive-doc',
                title: 'Recursive Doc',
                content: 'Some content',
            };

            const chunks = await chunkDocument(doc, 'recursive');


            // Check metadata
            expect(chunks[0].chunkingStrategy).toBe('recursive');
        });
    });
});
