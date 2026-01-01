/**
 * Shared API response utilities
 * Eliminates duplicate createResponse() functions across handlers
 */

import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Create a standardized API response with CORS headers
 */
export function createResponse(statusCode: number, body: object): APIGatewayProxyResult {
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
 * Create a success response (200)
 */
export function successResponse(body: object): APIGatewayProxyResult {
    return createResponse(200, body);
}

/**
 * Create an accepted response (202) for async operations
 */
export function acceptedResponse(body: object): APIGatewayProxyResult {
    return createResponse(202, body);
}

/**
 * Create a bad request response (400)
 */
export function badRequestResponse(error: string, details?: object): APIGatewayProxyResult {
    const body: { error: string; details?: object } = { error };
    if (details) {
        body.details = details;
    }
    return createResponse(400, body);
}

/**
 * Create a not found response (404)
 */
export function notFoundResponse(error: string): APIGatewayProxyResult {
    return createResponse(404, { error });
}

/**
 * Create an internal server error response (500)
 */
export function errorResponse(error: Error | unknown): APIGatewayProxyResult {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createResponse(500, { error: 'Internal server error', message });
}
