# Changelog

All notable changes to the Doc Q&A Portal will be documented in this file.

## [1.3.1] - 2025-12-30

### Added

#### Chat History (Memory)
- **Conversation Context**: Bot now remembers previous interactions within a session
- **Frontend Update**: Appends conversation history to API requests
- **Backend Update**: `ask` handler relays history to LLM service
- **LLM Service**: Refactored to accept message arrays instead of single prompts
- **Unit Test**: Added `chat-history.test.ts` to verify memory recall

## [1.3.0] - 2025-12-30

### Changed

#### OpenAI SDK Migration
- **Migrated from `@openrouter/sdk` to OpenAI SDK** for cleaner, more standard code
- OpenRouter is fully compatible with OpenAI SDK using `baseURL` override
- Simplified LLM service code with better type safety
- Added OpenRouter app attribution headers (HTTP-Referer, X-Title)

---

## [1.2.0] - 2025-12-30

### Added

#### PDF & DOCX Text Extraction
- **AWS Textract** integration for PDF files (OCR capable)
- **pdf-parse-new** as fallback when Textract unavailable (free tier compatible)
- **Mammoth** library for DOCX files
- Automatic file type detection in worker Lambda
- Updated frontend to accept `.pdf` and `.docx` uploads
- Unit test for pdf-parse-new library

#### Infrastructure
- Textract permissions added to worker Lambda

---

## [1.1.0] - 2025-12-30

### Added

#### Hybrid S3 Upload Architecture
- **New `GET /upload-url` endpoint**: Generates presigned S3 URLs for direct file uploads
- **Direct S3 upload in frontend**: "Quick Upload" button with progress bar for instant file upload
- **S3 → SQS event notifications**: Files uploaded directly to S3 automatically trigger processing
- **Worker dual-mode support**: `ingest-worker.ts` now handles both API-queued and S3-event-triggered jobs

#### Infrastructure Updates
- S3 bucket CORS configuration for browser-based uploads
- SQS queue policy to allow S3 to send event notifications
- New `UploadUrlFunction` Lambda with presigned URL generation

### Changed
- **Docs page UI**: Added prominent "Quick Upload" section with progress indicator
- **README**: Updated with hybrid architecture documentation and new endpoint details

### Technical Details
- Presigned URLs expire after 5 minutes
- S3 objects in `uploads/` prefix trigger SQS notifications
- Document metadata (docId, title) extracted from S3 object metadata or derived from filename
- Files automatically deleted from S3 after processing completes

---

## [1.0.0] - 2025-12-29

### Initial Release
- **POST /ingest**: Async document ingestion with S3 + SQS
- **POST /ask**: RAG-based question answering with Pinecone + OpenRouter
- **GET /documents**: List ingested documents
- **DELETE /documents/:docId**: Remove documents and their chunks
- Next.js + TypeScript frontend with Markdown rendering
- AWS SAM infrastructure (API Gateway + Lambda + S3 + SQS)
- Unit tests for chunking and prompt building
