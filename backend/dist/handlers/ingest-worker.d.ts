/**
 * Lambda handler for SQS-triggered async document processing
 * Handles both API-queued jobs and S3-event triggered jobs
 * Supports: .txt, .md (plain text), .pdf (Textract), .docx (Mammoth)
 */
import { SQSEvent, Context } from 'aws-lambda';
/**
 * Lambda handler for SQS events
 */
export declare function handler(event: SQSEvent, context: Context): Promise<void>;
//# sourceMappingURL=ingest-worker.d.ts.map