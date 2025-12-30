/**
 * Local development server for testing
 * Run: npx ts-node local-server.ts
 */

import http from 'http';
import { URL } from 'url';
import { handler as ingestHandler } from './src/handlers/ingest';
import { handler as askHandler } from './src/handlers/ask';
import { handler as documentsHandler } from './src/handlers/documents';
import { handler as uploadUrlHandler } from './src/handlers/upload-url';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { config } from 'dotenv';

config();

const PORT = 3001;

function createMockEvent(
    body: string,
    path: string,
    method: string,
    pathParams?: Record<string, string>,
    queryParams?: Record<string, string>
): APIGatewayProxyEvent {
    return {
        body,
        headers: { 'content-type': 'application/json' },
        multiValueHeaders: {},
        httpMethod: method,
        isBase64Encoded: false,
        path,
        pathParameters: pathParams || null,
        queryStringParameters: queryParams || null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as APIGatewayProxyEvent['requestContext'],
        resource: '',
    };
}

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
        try {
            const fullUrl = new URL(req.url || '', `http://localhost:${PORT}`);
            const url = fullUrl.pathname;
            const queryParams: Record<string, string> = {};
            fullUrl.searchParams.forEach((value, key) => {
                queryParams[key] = value;
            });
            let result;

            if (url === '/ingest' && req.method === 'POST') {
                const event = createMockEvent(body, url, 'POST');
                result = await ingestHandler(event);
            } else if (url === '/ask' && req.method === 'POST') {
                const event = createMockEvent(body, url, 'POST');
                result = await askHandler(event);
            } else if (url === '/upload-url' && req.method === 'GET') {
                const event = createMockEvent('', url, 'GET', undefined, queryParams);
                result = await uploadUrlHandler(event);
            } else if (url === '/documents' && req.method === 'GET') {
                const event = createMockEvent('', url, 'GET');
                result = await documentsHandler(event);
            } else if (url.match(/^\/documents\/[^/]+\/content$/) && req.method === 'GET') {
                // GET /documents/:docId/content
                const docId = decodeURIComponent(url.replace('/documents/', '').replace('/content', ''));
                const event = createMockEvent('', url, 'GET', { docId });
                result = await documentsHandler(event);
            } else if (url.startsWith('/documents/') && req.method === 'DELETE') {
                const docId = decodeURIComponent(url.replace('/documents/', ''));
                const event = createMockEvent('', url, 'DELETE', { docId });
                result = await documentsHandler(event);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
                return;
            }

            res.writeHead(result.statusCode, result.headers as http.OutgoingHttpHeaders);
            res.end(result.body);
        } catch (error) {
            console.error('Server error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Local API server running at http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('  POST   /ingest            - Ingest documents');
    console.log('  POST   /ask               - Ask questions');
    console.log('  GET    /upload-url        - Get presigned S3 upload URL');
    console.log('  GET    /documents         - List documents');
    console.log('  DELETE /documents/:id     - Delete a document');
});

