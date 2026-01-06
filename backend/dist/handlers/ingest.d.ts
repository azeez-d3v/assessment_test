/**
 * Lambda handler for POST /ingest (ASYNC)
 * Writes documents to S3 and queues to SQS for background processing
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=ingest.d.ts.map