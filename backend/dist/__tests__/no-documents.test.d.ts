/**
 * Test No Documents Handling
 * Run with: npx tsx src/__tests__/no-documents.test.ts
 *
 * This test verifies that:
 * 1. hasDocuments() correctly detects when the Pinecone index is empty
 * 2. The LLM responds appropriately when no relevant documents are found
 * 3. Greetings still work even when no documents are available
 * 4. The ask handler skips embedding/query when no documents exist (saves compute)
 */
export {};
//# sourceMappingURL=no-documents.test.d.ts.map