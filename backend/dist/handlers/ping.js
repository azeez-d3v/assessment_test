"use strict";
/**
 * Lambda handler for GET /ping
 * Simple health check endpoint
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
async function handler() {
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
//# sourceMappingURL=ping.js.map