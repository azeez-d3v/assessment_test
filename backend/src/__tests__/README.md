# Manual Test Scripts

This directory contains standalone manual test scripts used to verify specific functionality during development without needing a full deployment.

These tests are **not** part of the automated test suite (`npm test`) because they:
1. Make real network requests (OpenAI, S3, etc.)
2. Require valid environment variables (`.env`)
3. Are used for ad-hoc verification of new features

## How to Run

Run these scripts using `npx tsx` from the `backend` directory:

```bash
# Verify Chat History Memory
npx tsx src/__tests__/chat-history.test.ts

# Verify OpenAI SDK Integration
npx tsx src/__tests__/openai-sdk.test.ts

# Verify PDF Parsing Library
npx tsx src/__tests__/pdf-parse.test.ts
```

## Prerequisites

Ensure you have a `.env` file in the `backend` directory with the necessary API keys:
- `OPENROUTER_API_KEY`
- `AWS_ACCESS_KEY_ID` / `section` (if testing S3)
