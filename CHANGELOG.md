# Changelog

All notable changes to the Doc Q&A Portal will be documented in this file.

## [1.6.0] - 2026-01-06

### Added

#### Azure Document Intelligence Integration
- **Enhanced PDF Processing**: Added Azure AI Document Intelligence (Layout model) for superior PDF text extraction
- **Markdown Output**: Azure returns structured Markdown with preserved headers, tables, and formatting
- **3-Tier Fallback**: PDF extraction now tries Azure → AWS Textract → pdf-parse (in order)
- **Optional Configuration**: Works without Azure credentials (falls back to Textract/pdf-parse)
- **Manual Test**: Added `azure-doc-intel.test.ts` for verifying Azure integration

### Changed
- **Worker Timeout**: Increased `IngestWorkerFunction` timeout from 120s to 300s to accommodate Azure processing

### Technical
- **New Service**: `src/services/azure-doc-intel.ts` with `isAzureConfigured()` and `analyzeDocumentWithAzure()`
- **Dependencies**: Added `@azure-rest/ai-document-intelligence` and `@azure/core-auth`
- **Infrastructure**: New SAM parameters for `AzureDocumentIntelligenceEndpoint` and `AzureDocumentIntelligenceKey`

---

## [1.5.3] - 2026-01-05

### Added

#### Dual Chunking Strategy
- **Frontend Toggle**: Switch between **Smart Recursive** and **Fixed-Size** chunking during ingestion
- **Fixed-Size Strategy**: Restored 500-char chunks with overlap (best for code/dense docs)
- **Recursive Strategy (Default)**: Existing chonkiejs implementation (best for large docs, articles)
- **S3 Upload Dialog**: New settings dialog when uploading files to S3 to select strategy
- **Metadata Storage**: Strategy used is stored in Pinecone metadata for tracking

### Technical
- **Config**: Added shared constants for fixed chunking (size=500, overlap=50)
- **API**: `/ingest` and `/upload-url` endpoints now accept `chunkingStrategy` param
- **Handlers**: Updated worker to read strategy from SQS message or S3 metadata

### Changed
- **UX Refinements**: 
  - Upload dialog cards are now fully clickable
  - Improved button spacing and hover states (matching theme colors)
  - Explicit pointer cursors for better interactivity
- **Testing**: Added comprehensive `chunking-strategy.test.ts` covering logic, overlap, and metadata persistence (18 tests total)

## [1.5.2] - 2026-01-03

### Changed

#### Dynamic Relevance Threshold for Source Filtering
**Previous:** Fixed threshold of `0.5` - sources only shown if similarity score ≥ 0.5

**Current:** Dynamic threshold = `max(topScore × 0.7, 0.25)`

| Approach | Pros | Cons |
|----------|------|------|
| **Fixed 0.5** | Simple, predictable | Filters out relevant sources on multi-topic queries |
| **Dynamic 70%** | Adapts to query complexity, shows all relevant sources | Slightly more complex logic |

**Result:** Multi-topic queries like "return policy AND shipping" now correctly show sources from both documents instead of just one.

#### Filter Before LLM (Scalability Optimization)
**Previous:** All Pinecone chunks sent to LLM, filtered only for source display

**Current:** Chunks filtered by dynamic threshold BEFORE sending to LLM

| Approach | Pros | Cons |
|----------|------|------|
| **Previous (filter after)** | LLM sees all context | More tokens, higher cost, slower |
| **Current (filter before)** | Fewer tokens, faster, cheaper, cleaner answers | Relies on score accuracy |

**Result:** LLM only processes relevant chunks → reduced token usage, faster responses, consistent sources.

## [1.5.1] - 2026-01-02

### Added

#### Floating Navbar
- **New `FloatingHeader` component**: Modern floating navbar with glassmorphism effect
- **GitHub button**: Quick access to repository with GitHub icon (lucide-react)
- **Responsive mobile menu**: Sheet-based navigation for mobile devices
- **Shorter nav labels**: "Chat" and "Documents" instead of verbose names

#### Warning Banner Improvements
- **AlertTriangle icon**: Added warning icon to no-documents banner
- **Responsive text**: Shorter mobile text (`No docs · Limited response`) vs full desktop message
- **Single-line layout**: All elements stay on one line across all screen sizes

#### Backend: No-Documents Handling
- **`hasDocuments()` function**: O(1) check using `describeIndexStats()` to detect empty index
- **Greeting support**: Greetings now work even when no documents are uploaded
- **Manual test suite**: Added `no-documents.test.ts` for verifying behavior

### Changed
- **Sheet component**: Added `showClose` prop for optional close button
- **Nav hover styles**: Text-only hover effect (no background color)
- **Mobile nav hover**: White text on hover for better visibility
- **LLM prompt**: Stricter instructions to never answer substantive questions without documents
- **Ask handler**: Skips embedding/query when index is empty, passes empty chunks to LLM

### Removed
- **Extended thinking button**: Commented out for future implementation

## [1.5.0] - 2026-01-02

### Changed

#### Chunking Strategy: chonkiejs Integration
- **Migrated to `@chonkiejs/core`**: RecursiveChunker for smarter text splitting
- **Hierarchical splitting**: Paragraphs → Sentences → Punctuation → Words → Characters
- **Better RAG quality**: Chunks respect semantic boundaries, producing focused embeddings
- **Optimized chunk size**: 1200 characters (~300-400 tokens) for better embedding quality
- **No more overlap hacks**: Recursive strategy preserves context naturally

### Added
- **Shared config**: `src/config/chunking.ts` with `CHUNK_SIZE` and `MIN_CHARS_PER_CHUNK`
- **Behavior-based tests**: Tests validate invariants (no data loss, size limits) not implementation

### Technical
- `chunkText()`, `chunkDocument()`, `chunkDocuments()` are now async
- 12 tests covering chunking behavior including FAQ use case

## [1.4.1] - 2026-01-02

### Added

#### SWR Caching for Document List
- **`useDocuments` hook**: Caches document list across page navigations
- **Request deduplication**: Multiple components share single API call
- **Automatic revalidation**: Cache invalidates after mutations (ingest/delete)
- **Zero redundant calls**: Navigate Chat → Docs → Chat = 1 API call (was 3)

## [1.4.0] - 2026-01-01

### Added

#### API Gateway Rate Limiting
- **Usage Plan**: Added API rate limiting (10 req/min, burst of 10, 10k/day quota)
- **Method Throttling**: Applied at API Gateway stage level for all endpoints

#### Shared Utilities
- **`response.ts`**: Extracted shared response helper from all handlers (reduced ~80 lines duplicate code)
- **`openai.ts`**: Shared OpenAI client for LLM and embeddings services (single instance)

### Fixed

#### Critical Performance Issues
- **N+1 Query Fix**: `listDocuments()` now batch-fetches all vectors instead of one-per-document (10-100x faster)
- **Parallel Ingestion**: S3/SQS operations in `asyncIngest()` now run in parallel via `Promise.all()`

#### Frontend Bugs
- **Memory Leak**: Fixed blob URL leak by revoking `URL.createObjectURL()` when files are removed
- **Retry Button**: Now replaces failed messages instead of duplicating them with new `handleRetry()` function
- **Error Messages**: API errors now show actual server error message instead of generic "Failed to get answer"

#### Code Quality
- **Chunking Validation**: Added check to prevent infinite loop when `chunkOverlap >= chunkSize`
- **Type Safety**: Replaced `any[]` with proper typed arrays in sync ingest handler

## [1.3.2] - 2025-12-30

### Added

#### UI/UX Refinements
- **Empty Document State**: Added a "No documents found" warning banner in the chat input when the index is empty
- **Claude-style Warning**: Replicated Claude's UI warning banner style (colors, layout, behavior)
- **Smooth Transitions**: Added CSS transitions for the warning banner to animate in/out without layout shifts
- **Loading State Fix**: Fixed flickering warning banner on initial page load by initializing count to `null`

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
