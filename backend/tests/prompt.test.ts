/**
 * Unit tests for prompt/message building
 */

import { describe, it, expect } from 'vitest';
import { buildMessages } from '../src/services/llm';
import { RetrievedChunk } from '../src/types';

describe('buildMessages', () => {
    it('builds messages with retrieved chunks', () => {
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

        const messages = buildMessages(question, chunks);

        // Should return an array of messages
        expect(Array.isArray(messages)).toBe(true);
        expect(messages.length).toBeGreaterThanOrEqual(2);

        // First message should be system message
        expect(messages[0].role).toBe('system');
        const systemContent = messages[0].content as string;

        // System message should contain chunk texts
        expect(systemContent).toContain('Full refund within 30 days.');
        expect(systemContent).toContain('Items must be in original condition.');

        // System message should contain document titles
        expect(systemContent).toContain('Refund Policy');
        expect(systemContent).toContain('Return Guidelines');

        // System message should contain knowledge base section
        expect(systemContent).toContain('KNOWLEDGE BASE:');

        // Last message should be user message with question
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.role).toBe('user');
        expect(lastMessage.content).toBe(question);
    });

    it('handles empty chunks array', () => {
        const question = 'What is the meaning of life?';
        const chunks: RetrievedChunk[] = [];

        const messages = buildMessages(question, chunks);

        // Should still return messages
        expect(Array.isArray(messages)).toBe(true);
        expect(messages.length).toBeGreaterThanOrEqual(2);

        // System message should indicate no documents found
        const systemContent = messages[0].content as string;
        expect(systemContent.toLowerCase()).toContain('no relevant documents');

        // User message should contain the question
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.content).toBe(question);
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

        const messages = buildMessages('Question?', chunks);
        const systemContent = messages[0].content as string;

        expect(systemContent).toContain('[Document 1:');
        expect(systemContent).toContain('[Document 2:');
    });
});
