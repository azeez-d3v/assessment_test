"use strict";
/**
 * Azure AI Document Intelligence Service
 * Uses the prebuilt-layout model to extract text from PDFs as Markdown
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAzureConfigured = isAzureConfigured;
exports.analyzeDocumentWithAzure = analyzeDocumentWithAzure;
const ai_document_intelligence_1 = __importStar(require("@azure-rest/ai-document-intelligence"));
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '';
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || '';
/**
 * Check if Azure Document Intelligence is configured
 */
function isAzureConfigured() {
    return !!(endpoint && key);
}
/**
 * Analyze a PDF document using Azure Document Intelligence
 * Returns the document content as Markdown
 */
async function analyzeDocumentWithAzure(buffer) {
    if (!isAzureConfigured()) {
        throw new Error('Azure Document Intelligence is not configured');
    }
    console.log('Analyzing document with Azure Document Intelligence...');
    // Create client with API key
    const client = (0, ai_document_intelligence_1.default)(endpoint, {
        key,
    });
    // Start the analysis with prebuilt-layout model and markdown output
    const initialResponse = await client
        .path('/documentModels/{modelId}:analyze', 'prebuilt-layout')
        .post({
        contentType: 'application/octet-stream',
        body: buffer, // SDK expects string but we send buffer
        queryParameters: {
            outputContentFormat: 'markdown',
        },
    });
    if ((0, ai_document_intelligence_1.isUnexpected)(initialResponse)) {
        const error = initialResponse.body.error;
        throw new Error(`Azure Document Intelligence error: ${error?.message || 'Unknown error'}`);
    }
    // Poll until the analysis is complete
    const poller = (0, ai_document_intelligence_1.getLongRunningPoller)(client, initialResponse);
    const result = await poller.pollUntilDone();
    // Access the analyze result - the poller returns the logical response
    const body = result.body;
    const content = body.analyzeResult?.content || '';
    console.log(`Azure Document Intelligence extracted ${content.length} chars as Markdown`);
    return content;
}
//# sourceMappingURL=azure-doc-intel.js.map