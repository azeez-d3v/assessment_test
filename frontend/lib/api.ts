const API_URL = process.env.NEXT_PUBLIC_API_URL

export interface DocumentInfo {
  docId: string
  title: string
  chunkCount: number
}

export async function askQuestion(question: string, topK = 3) {
  const response = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question, topK }),
  })

  if (!response.ok) {
    throw new Error("Failed to get answer")
  }

  return response.json()
}

export async function ingestDocuments(documents: Array<{ id: string; title: string; content: string }>) {
  const response = await fetch(`${API_URL}/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documents }),
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
