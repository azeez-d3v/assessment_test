/**
 * Lambda handler for GET /documents and DELETE /documents/:id
 * Lists and deletes documents from Pinecone
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { listDocuments, deleteByDocId, getDocumentContent } from '../services/pinecone';

/**
 * Create a standardized API response
 */
function createResponse(statusCode: number, body: object): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(body),
    };
}

/**
 * Lambda handler
 */
export async function handler(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    try {
        const method = event.httpMethod;
        const docId = event.pathParameters?.docId;
        const path = event.path || '';

        // GET /documents - List all documents
        if (method === 'GET' && !docId) {
            const documents = await listDocuments();
            return createResponse(200, { documents });
        }

        // GET /documents/:docId/content - Get document content
        if (method === 'GET' && docId && path.endsWith('/content')) {
            const result = await getDocumentContent(docId);
            if (!result) {
                return createResponse(404, { error: 'Document not found' });
            }
            return createResponse(200, result);
        }

        // DELETE /documents/:docId - Delete a document
        if (method === 'DELETE' && docId) {
            const deletedCount = await deleteByDocId(docId);
            return createResponse(200, {
                message: `Document ${docId} deleted`,
                deletedChunks: deletedCount,
            });
        }

        return createResponse(400, { error: 'Invalid request' });

    } catch (error) {
        console.error('Documents error:', error);
        return createResponse(500, {
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
