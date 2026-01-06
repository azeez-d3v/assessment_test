/**
 * Lambda handler for POST /ask
 * Answers questions using RAG: embed → query Pinecone → LLM
 */
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
/**
 * Lambda handler
 */
export declare function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
//# sourceMappingURL=ask.d.ts.map