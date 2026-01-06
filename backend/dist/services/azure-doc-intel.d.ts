/**
 * Azure AI Document Intelligence Service
 * Uses the prebuilt-layout model to extract text from PDFs as Markdown
 */
/**
 * Check if Azure Document Intelligence is configured
 */
export declare function isAzureConfigured(): boolean;
/**
 * Analyze a PDF document using Azure Document Intelligence
 * Returns the document content as Markdown
 */
export declare function analyzeDocumentWithAzure(buffer: Buffer): Promise<string>;
//# sourceMappingURL=azure-doc-intel.d.ts.map