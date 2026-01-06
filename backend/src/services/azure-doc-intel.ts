/**
 * Azure AI Document Intelligence Service
 * Uses the prebuilt-layout model to extract text from PDFs as Markdown
 */

import DocumentIntelligence, {
    getLongRunningPoller,
    isUnexpected,
} from '@azure-rest/ai-document-intelligence';

/**
 * Get Azure credentials (lazy-loaded to support dotenv)
 */
function getAzureCredentials() {
    return {
        endpoint: process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '',
        key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || '',
    };
}

/**
 * Check if Azure Document Intelligence is configured
 */
export function isAzureConfigured(): boolean {
    const { endpoint, key } = getAzureCredentials();
    return !!(endpoint && key);
}

/**
 * Analyze a PDF document using Azure Document Intelligence
 * Returns the document content as Markdown
 */
export async function analyzeDocumentWithAzure(buffer: Buffer): Promise<string> {
    if (!isAzureConfigured()) {
        throw new Error('Azure Document Intelligence is not configured');
    }

    console.log('Analyzing document with Azure Document Intelligence...');

    // Get credentials (lazy-loaded)
    const { endpoint, key } = getAzureCredentials();

    // Create client with API key
    const client = DocumentIntelligence(endpoint, {
        key,
    });

    // Start the analysis with prebuilt-layout model and markdown output
    const initialResponse = await client
        .path('/documentModels/{modelId}:analyze', 'prebuilt-layout')
        .post({
            contentType: 'application/octet-stream',
            body: buffer as unknown as string, // SDK expects string but we send buffer
            queryParameters: {
                outputContentFormat: 'markdown',
            },
        });

    if (isUnexpected(initialResponse)) {
        const error = initialResponse.body.error;
        throw new Error(`Azure Document Intelligence error: ${error?.message || 'Unknown error'}`);
    }

    // Poll until the analysis is complete
    const poller = getLongRunningPoller(client, initialResponse);
    const result = await poller.pollUntilDone();

    // Access the analyze result - the poller returns the logical response
    const body = result.body as { analyzeResult?: { content?: string } };
    const content = body.analyzeResult?.content || '';

    console.log(`Azure Document Intelligence extracted ${content.length} chars as Markdown`);
    return content;
}
