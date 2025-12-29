/**
 * Lambda handler for GET /ping
 * Simple health check endpoint
 */

import { APIGatewayProxyResult } from 'aws-lambda';

export async function handler(): Promise<APIGatewayProxyResult> {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'Doc Q&A Portal API',
        }),
    };
}
