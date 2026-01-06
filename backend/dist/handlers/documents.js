"use strict";
/**
 * Lambda handler for GET /documents and DELETE /documents/:id
 * Lists and deletes documents from Pinecone
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const pinecone_1 = require("../services/pinecone");
const response_1 = require("../utils/response");
/**
 * Lambda handler
 */
async function handler(event) {
    try {
        const method = event.httpMethod;
        const docId = event.pathParameters?.docId;
        const path = event.path || '';
        // GET /documents - List all documents
        if (method === 'GET' && !docId) {
            const documents = await (0, pinecone_1.listDocuments)();
            return (0, response_1.createResponse)(200, { documents });
        }
        // GET /documents/:docId/content - Get document content
        if (method === 'GET' && docId && path.endsWith('/content')) {
            const result = await (0, pinecone_1.getDocumentContent)(docId);
            if (!result) {
                return (0, response_1.createResponse)(404, { error: 'Document not found' });
            }
            return (0, response_1.createResponse)(200, result);
        }
        // DELETE /documents/:docId - Delete a document
        if (method === 'DELETE' && docId) {
            const deletedCount = await (0, pinecone_1.deleteByDocId)(docId);
            return (0, response_1.createResponse)(200, {
                message: `Document ${docId} deleted`,
                deletedChunks: deletedCount,
            });
        }
        return (0, response_1.createResponse)(400, { error: 'Invalid request' });
    }
    catch (error) {
        console.error('Documents error:', error);
        return (0, response_1.createResponse)(500, {
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
//# sourceMappingURL=documents.js.map