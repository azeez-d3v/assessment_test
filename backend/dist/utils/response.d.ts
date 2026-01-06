/**
 * Shared API response utilities
 * Eliminates duplicate createResponse() functions across handlers
 */
import { APIGatewayProxyResult } from 'aws-lambda';
/**
 * Create a standardized API response with CORS headers
 */
export declare function createResponse(statusCode: number, body: object): APIGatewayProxyResult;
/**
 * Create a success response (200)
 */
export declare function successResponse(body: object): APIGatewayProxyResult;
/**
 * Create an accepted response (202) for async operations
 */
export declare function acceptedResponse(body: object): APIGatewayProxyResult;
/**
 * Create a bad request response (400)
 */
export declare function badRequestResponse(error: string, details?: object): APIGatewayProxyResult;
/**
 * Create a not found response (404)
 */
export declare function notFoundResponse(error: string): APIGatewayProxyResult;
/**
 * Create an internal server error response (500)
 */
export declare function errorResponse(error: Error | unknown): APIGatewayProxyResult;
//# sourceMappingURL=response.d.ts.map