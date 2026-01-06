"use strict";
/**
 * Shared API response utilities
 * Eliminates duplicate createResponse() functions across handlers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponse = createResponse;
exports.successResponse = successResponse;
exports.acceptedResponse = acceptedResponse;
exports.badRequestResponse = badRequestResponse;
exports.notFoundResponse = notFoundResponse;
exports.errorResponse = errorResponse;
/**
 * Create a standardized API response with CORS headers
 */
function createResponse(statusCode, body) {
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
function successResponse(body) {
    return createResponse(200, body);
}
/**
 * Create an accepted response (202) for async operations
 */
function acceptedResponse(body) {
    return createResponse(202, body);
}
/**
 * Create a bad request response (400)
 */
function badRequestResponse(error, details) {
    const body = { error };
    if (details) {
        body.details = details;
    }
    return createResponse(400, body);
}
/**
 * Create a not found response (404)
 */
function notFoundResponse(error) {
    return createResponse(404, { error });
}
/**
 * Create an internal server error response (500)
 */
function errorResponse(error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createResponse(500, { error: 'Internal server error', message });
}
//# sourceMappingURL=response.js.map