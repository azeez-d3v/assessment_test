# Doc Q&A Portal

A document Q&A application that enables semantic search and question answering over your documents using RAG (Retrieval Augmented Generation) with Pinecone vector database and LLM.

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Node.js + TypeScript on AWS Lambda
- **Vector Store**: Pinecone
- **LLM & Embeddings**: OpenAI SDK (compatible with OpenRouter)
- **Infrastructure**: AWS SAM (API Gateway + Lambda)

## Project Structure

```
assessment_test/
├── frontend/          # Next.js application
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks (useDocuments with SWR)
│   └── lib/           # API utilities
├── backend/           # Lambda functions
│   ├── src/
│   │   ├── __tests__/ # Manual test scripts (chat history, openai sdk, etc)
│   │   ├── config/    # Shared configuration (chunking constants)
│   │   ├── handlers/  # Lambda handlers (ingest, ask, upload-url)
│   │   ├── services/  # Business logic (chunking, embeddings, llm, pinecone, openai)
│   │   ├── types/     # TypeScript interfaces
│   │   └── utils/     # Validation schemas, response helpers
│   ├── tests/         # Unit tests (12 chunking + 3 prompt)
│   └── template.yaml  # SAM infrastructure (with rate limiting)
└── README.md
```

## Environment Variables

### Backend (`backend/.env`)

```env
OPENROUTER_API_KEY=your_openrouter_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Pinecone account with an index created (1536 dimensions)
- OpenRouter API key (for both LLM and embeddings)

### Backend (Recommended: SAM Local)

We use **AWS SAM Local** to run the API because it simulates the exact Lambda environment (including Docker).

1.  **Install Prerequisites**:
    *   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Must be running)
    *   [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

2.  **Setup Environment**:
    ```bash
    cd backend
    pnpm install
    
    # Create .env with your keys
    cp .env.example .env
    # Edit .env with your real keys
    
    # Generate the SAM-compatible env.json from your .env
    node generate-env-json.js
    ```

3.  **Run the API**:
    ```bash
    # Build the project
    sam build

    # Start the local API Gateway
    sam local start-api --env-vars env.json
    ```
    The API runs on `http://127.0.0.1:3000`.

4.  **Legacy Method (No Docker)**:
    If you cannot run Docker, you can use the simple Node.js runner:
    ```bash
    npx ts-node local-server.ts
    ```
    *Note: This does not support async ingestion or textract.*

### Frontend

```bash
cd frontend
pnpm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start development server
pnpm dev
```

The frontend runs on `http://localhost:3000`.

## Running Tests

```bash
cd backend
pnpm test
```

Tests cover:
- **Chunking**: Text splitting, overlap, document metadata
- **Dual Strategy Verification**: Explicit tests for fixed vs recursive strategy logic and switching
- **Prompt Building**: RAG prompt construction, empty chunk handling

## API Endpoints

### POST /ingest

Ingests documents into the vector database.

**Request:**
```json
{
  "documents": [
    {
      "id": "refund-policy",
      "title": "Refund Policy",
      "content": "Full refund within 30 days with receipt. No refunds on digital goods."
    }
  ]
}
```

**Response:**
```json
{
  "ingestedDocuments": 1,
  "ingestedChunks": 4
}
```

### POST /ask

Queries documents and generates an answer.

**Request:**
```json
{
  "question": "Can I get a refund on a digital product?",
  "topK": 3
}
```

**Response:**
```json
{
  "answer": "Digital products are not eligible for refunds.",
  "sources": [
    { "docId": "refund-policy", "title": "Refund Policy" }
  ]
}
```

### GET /documents

Lists all ingested documents.

### DELETE /documents/:docId

Deletes a document and its chunks.

### GET /upload-url

Generates a presigned S3 URL for direct file upload.

**Request:**
```
GET /upload-url?filename=my-document.md
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "s3Key": "uploads/uuid/my-document.md",
  "docId": "my-document",
  "title": "my-document",
  "expiresIn": 300
}
```

**Usage:**
1. Call `GET /upload-url` with your filename
2. `PUT` the file contents to the returned `uploadUrl`
3. S3 event triggers background processing automatically

## Deployment

### AWS SAM Deployment

```bash
cd backend

# Build
sam build

# Deploy (first time - guided) Interactive
sam deploy --guided

# Deploy (subsequent)
sam deploy --parameter-overrides \
  OpenRouterApiKey=YOUR_KEY \
  PineconeApiKey=YOUR_KEY \
  PineconeIndex=YOUR_INDEX
```

### Frontend Deployment

Deploy to Vercel:
```bash
cd frontend
vercel
```

Update `NEXT_PUBLIC_API_URL` to your API Gateway endpoint.

## Assumptions & Trade-offs

### Chunking Strategy
- **Dual Strategy Support**: Choose between "Smart Recursive" and "Fixed-Size" chunking.
- **RecursiveChunker (Default)**:
  - Uses `@chonkiejs/core` library
  - Hierarchical splitting: paragraphs → sentences → punctuation → words → characters
  - Best for prose, articles, FAQs (preserves semantic context)
  - Chunk size: ~1200 characters (~300-400 tokens)
- **Fixed-Size Chunking (Legacy/Technical)**:
  - Traditional fixed window with overlap
  - Best for dense technical documents, code, or data-heavy text
  - Chunk size: 500 characters, Overlap: 50 characters
- **Selection**: Configurable via frontend toggle (API/form) or upload dialog (S3 direct)

### Embedding & LLM
- Powered by **OpenAI SDK** (configured for OpenRouter)
- Embeddings: `openai/text-embedding-3-small` (1536 dimensions)
- LLM: `openai/gpt-4o-mini` (configurable via `LLM_MODEL` env var)

### Chat History (Memory)
- **Full Conversation Context**: The bot remembers previous questions and context within a session.
- **Frontend**: Stateless UI sends full conversation history with each request.
- **Backend**: Appends previous 10 messages to the system prompt for context continuity.

### Source Filtering
- **Dynamic threshold**: `max(topScore × 0.7, 0.25)` - adapts to query complexity
- Multi-topic queries show sources from all relevant documents
- Floor of 0.25 prevents showing low-quality matches
- **Filter before LLM**: Only relevant chunks sent to LLM (scalable, cheaper)

### No Authentication
- As per requirements, no auth implemented
- Add API keys or JWT for production

### Async Ingest Architecture (Bonus Feature)

The `/ingest` endpoint uses an async architecture for scalability:

```
POST /ingest → IngestFunction → S3 (store doc) → SQS (queue job) → 202 Accepted
                                                       ↓
                                         IngestWorkerFunction (SQS trigger)
                                                       ↓
                                     Read S3 → Chunk → Embed → Pinecone upsert
```

**Components:**
- **S3 Bucket** (`doc-qa-ingest-*`): Stores document content before processing
- **SQS Queue** (`doc-qa-ingest-queue`): Job queue with Dead Letter Queue (3 retries)
- **IngestWorkerFunction**: Triggered by SQS, processes documents in background

**Benefits:**
- Instant response (202 Accepted) - user doesn't wait for processing
- Handles large documents (no Lambda timeout issues)
- Automatic retries on failure via SQS redrive policy
- Scalable - SQS buffers traffic spikes

**File Upload Support:**
The frontend supports uploading `.md` and `.txt` files, which are read as plain text and ingested like manually-entered documents.

### Hybrid S3 Upload Architecture (Scalable File Ingestion)

The app supports two ingestion paths:

**Path 1: API Ingestion (Plain Text)**
```
POST /ingest → IngestFunction → S3 + SQS → 202 Accepted
                                     ↓
                          IngestWorkerFunction (SQS trigger)
                                     ↓
                      Read S3 → Chunk → Embed → Pinecone
```

**Path 2: Direct S3 Upload (Scalable)**
```
GET /upload-url → Presigned S3 URL
        ↓
PUT file to S3 → S3 Event → SQS → IngestWorkerFunction
                                        ↓
               Detect file type → Extract text → Chunk → Embed → Pinecone
```

**Text Extraction by File Type:**
| Extension | Method |
|-----------|--------|
| `.txt`, `.md` | Plain text read |
| `.pdf` | AWS Textract (with `pdf-parse-new` fallback) |
| `.docx` | Mammoth library |

**Why Hybrid?**
- **API path**: Best for programmatic ingestion, user controls metadata
- **S3 path**: Best for large files, bypasses API Gateway 10MB limit, supports binary files

### UI & UX Enhancements (Bonus Feature)

The frontend includes several polish items with a **Claude-inspired aesthetic**:
- **Rich Text Chat**: The chat interface supports **Markdown rendering**, allowing for bold text, italics, lists, and headers in responses.
- **Improved Typography**: Custom styling and color palettes (warm beige backgrounds, terra-cotta accents) matching high-end AI assistants.
- **Global Scrollbar Hiding**: A cleaner, modern look with hidden scrollbars (while maintaining functionality) across the application.
- **Smart File Input**: The file upload area handles `.md` and `.txt` files with auto-populating fields and scrollable content preview.
- **Empty State Handling**: Intelligent UI that detects when no documents are indexed, showing a warning banner identical to industry-standard interfaces.
- **Smooth Animations**: Transitions for UI elements to prevent jarring layout shifts.

### Rate Limiting (Production Ready)

The API Gateway includes built-in rate limiting to prevent abuse:
- **10 requests/minute** sustained rate
- **10 requests** burst capacity
- **10,000 requests/day** quota

### Performance Optimizations

- **SWR Caching**: Document list cached across page navigations (no redundant API calls)
- **Batch Vector Fetching**: Document listing uses optimized batch queries (10-100x faster)
- **Parallel Ingestion**: Multiple documents are processed concurrently
- **Shared Service Clients**: Single OpenAI client instance across services

### Future Enhancements

While this assessment focused on delivering a robust, core RAG architecture and scalable ingestion pipeline, the following features would be prioritized for a production deployment:
- Implement streaming responses
- Add caching layer for frequently accessed documents
- Document versioning
- Improve mobile responsiveness
