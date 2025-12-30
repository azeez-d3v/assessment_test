# Doc Q&A Portal

A document Q&A application that enables semantic search and question answering over your documents using RAG (Retrieval Augmented Generation) with Pinecone vector database and LLM.

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Node.js + TypeScript on AWS Lambda
- **Vector Store**: Pinecone
- **LLM & Embeddings**: OpenRouter SDK (`@openrouter/sdk`)
- **Infrastructure**: AWS SAM (API Gateway + Lambda)

## Project Structure

```
assessment_test/
├── frontend/          # Next.js application
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   └── lib/           # API utilities
├── backend/           # Lambda functions
│   ├── src/
│   │   ├── handlers/  # Lambda handlers (ingest, ask, documents)
│   │   ├── services/  # Business logic (chunking, embeddings, llm, pinecone)
│   │   └── utils/     # Validation schemas
│   ├── tests/         # Unit tests
│   └── template.yaml  # SAM infrastructure
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

### Backend

```bash
cd backend
pnpm install

# Create .env file with your API keys
cp .env.example .env
# Edit .env with your keys

# Start local development server
npx ts-node local-server.ts
```

The backend runs on `http://localhost:3001`.

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
- Fixed-size chunks (500 chars) with overlap (50 chars)
- Attempts to break at sentence boundaries
- Simple but effective for most documents

### Embedding & LLM
- Powered by **OpenAI SDK** (configured for OpenRouter)
- Embeddings: `openai/text-embedding-3-small` (1536 dimensions)
- LLM: `openai/gpt-4o-mini` (configurable via `LLM_MODEL` env var)

### Chat History (Memory)
- **Full Conversation Context**: The bot remembers previous questions and context within a session.
- **Frontend**: Stateless UI sends full conversation history with each request.
- **Backend**: Appends previous 10 messages to the system prompt for context continuity.

### Source Filtering
- Similarity threshold of 0.5 filters irrelevant sources
- Prevents showing unrelated documents for generic questions

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

The frontend includes several polish items:
- **Rich Text Chat**: The chat interface supports **Markdown rendering**, allowing for bold text, italics, lists, and headers in responses.
- **Improved Typography**: Custom styling for chat messages with better line spacing and list formatting.
- **Global Scrollbar Hiding**: A cleaner, modern look with hidden scrollbars (while maintaining functionality) across the application.
- **Smart File Input**: The file upload area handles `.md` and `.txt` files with auto-populating fields and scrollable content preview.

### Future Enhancements

While this assessment focused on delivering a robust, core RAG architecture and scalable ingestion pipeline, the following features would be prioritized for a production deployment:
- Implement streaming responses
- Add rate limiting and caching
- Document versioning (implemented?)
- Improve mobile responsiveness

