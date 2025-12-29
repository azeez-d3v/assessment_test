/**
 * Unit tests for prompt building
 */

import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../src/services/llm';
import { RetrievedChunk } from '../src/types';

describe('buildPrompt', () => {
    it('builds prompt with retrieved chunks', () => {
        const question = 'What is the refund policy?';
        const chunks: RetrievedChunk[] = [
            {
                id: 'doc1#chunk-0',
                score: 0.95,
                metadata: {
                    docId: 'doc1',
                    title: 'Refund Policy',
                    chunkText: 'Full refund within 30 days.',
                    chunkIndex: 0,
                },
            },
            {
                id: 'doc2#chunk-1',
                score: 0.85,
                metadata: {
                    docId: 'doc2',
                    title: 'Return Guidelines',
                    chunkText: 'Items must be in original condition.',
                    chunkIndex: 1,
                },
            },
        ];

        const prompt = buildPrompt(question, chunks);

        // Check that prompt contains question
        expect(prompt).toContain(question);

        // Check that prompt contains all chunk texts
        expect(prompt).toContain('Full refund within 30 days.');
        expect(prompt).toContain('Items must be in original condition.');

        // Check that prompt contains document titles
        expect(prompt).toContain('Refund Policy');
        expect(prompt).toContain('Return Guidelines');

        // Check structure
        // Check structure
        expect(prompt).toContain('KNOWLEDGE BASE:');
        expect(prompt).toContain('CUSTOMER QUESTION:');
        expect(prompt).toContain('YOUR RESPONSE:');
    });

    it('handles empty chunks array', () => {
        const question = 'What is the meaning of life?';
        const chunks: RetrievedChunk[] = [];

        const prompt = buildPrompt(question, chunks);

        // Should still contain the question
        expect(prompt).toContain(question);

        // Should indicate no documents found
        expect(prompt.toLowerCase()).toContain("don't have enough information");
    });

    it('numbers documents in order', () => {
        const chunks: RetrievedChunk[] = [
            {
                id: 'a#0',
                score: 0.9,
                metadata: { docId: 'a', title: 'First', chunkText: 'Text A', chunkIndex: 0 },
            },
            {
                id: 'b#0',
                score: 0.8,
                metadata: { docId: 'b', title: 'Second', chunkText: 'Text B', chunkIndex: 0 },
            },
        ];

        const prompt = buildPrompt('Question?', chunks);

        expect(prompt).toContain('[Document 1:');
        expect(prompt).toContain('[Document 2:');
    });
});
