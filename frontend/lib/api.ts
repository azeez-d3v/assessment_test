const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface DocumentInfo {
  docId: string
  title: string
  chunkCount: number
}

export interface UploadUrlResponse {
  uploadUrl: string
  s3Key: string
  docId: string
  title: string
  expiresIn: number
}

export interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function askQuestion(question: string, messages: ApiMessage[] = [], topK = 3) {
  const response = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, messages, topK }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || error.error || "Failed to get answer")
  }

  return response.json()
}

export type ChunkingStrategy = 'fixed' | 'recursive';

export async function ingestDocuments(
  documents: Array<{ id: string; title: string; content: string }>,
  chunkingStrategy: ChunkingStrategy = 'recursive'
) {
  const response = await fetch(`${API_URL}/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documents, chunkingStrategy }),
  })

  if (!response.ok) {
    throw new Error("Failed to ingest documents")
  }

  return response.json()
}

export async function listDocuments(): Promise<{ documents: DocumentInfo[] }> {
  const response = await fetch(`${API_URL}/documents`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error("Failed to list documents")
  }

  return response.json()
}

export async function deleteDocument(docId: string): Promise<{ message: string; deletedChunks: number }> {
  const response = await fetch(`${API_URL}/documents/${encodeURIComponent(docId)}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete document")
  }

  return response.json()
}

export async function getDocumentContent(docId: string): Promise<{ title: string; content: string }> {
  const response = await fetch(`${API_URL}/documents/${encodeURIComponent(docId)}/content`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error("Failed to get document content")
  }

  return response.json()
}

/**
 * Get a presigned URL for direct S3 file upload
 */
export async function getUploadUrl(
  filename: string,
  chunkingStrategy: ChunkingStrategy = 'recursive'
): Promise<UploadUrlResponse> {
  const params = new URLSearchParams({
    filename,
    chunkingStrategy,
  })
  const response = await fetch(`${API_URL}/upload-url?${params}`, {
    method: "GET",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || "Failed to get upload URL")
  }

  return response.json()
}

/**
 * Upload a file directly to S3 using a presigned URL
 * Returns a promise that resolves when upload completes
 */
export function uploadFileToS3(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to network error"))
    })

    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", file.type || "text/plain")
    xhr.send(file)
  })
}

