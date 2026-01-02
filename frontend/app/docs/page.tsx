"use client"

import { useState } from "react"
import { FloatingHeader } from "@/components/ui/floating-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EditDocumentDialog } from "@/components/edit-document-dialog"
import { useToast } from "@/hooks/use-toast"
import { useDocuments } from "@/hooks/use-documents"
import { Toaster } from "@/components/ui/toaster"
import { ingestDocuments, deleteDocument, getDocumentContent, getUploadUrl, uploadFileToS3, DocumentInfo } from "@/lib/api"
import { X, Loader2, Trash2, RefreshCw, Pencil, Upload, CloudUpload, Maximize } from "lucide-react"
import { Icons } from "@/components/ui/claude-style-chat-input"

interface PendingDocument {
  id: string
  title: string
  content: string
}

export default function DocsPage() {
  const [docId, setDocId] = useState("")
  const [docTitle, setDocTitle] = useState("")
  const [docContent, setDocContent] = useState("")
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([])

  // Use SWR hook for cached document list
  const { documents: ingestedDocs, isLoading: listLoading, mutate: refreshDocs } = useDocuments()

  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editDoc, setEditDoc] = useState<{ docId: string; title: string; content: string } | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const [directUploadProgress, setDirectUploadProgress] = useState<number | null>(null)
  const [directUploading, setDirectUploading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  // Handle file upload - reads .md/.txt files
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['.md', '.txt']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!validTypes.includes(ext)) {
      toast({
        title: "Invalid File Type",
        description: "Only .md and .txt files are supported",
        variant: "destructive",
      })
      return
    }

    // Read file content
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      // Use filename (without extension) as ID and Title
      const baseName = file.name.replace(/\.(md|txt)$/i, '')
      setDocId(baseName.toLowerCase().replace(/\s+/g, '-'))
      setDocTitle(baseName)
      setDocContent(content)

      toast({
        title: "File Loaded",
        description: `"${file.name}" content loaded into form`,
      })
    }
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      })
    }
    reader.readAsText(file)

    // Reset input so same file can be selected again
    event.target.value = ''
  }

  // Handle direct S3 upload - uploads file directly to S3
  const handleDirectUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['.md', '.txt', '.pdf', '.docx']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!validTypes.includes(ext)) {
      toast({
        title: "Invalid File Type",
        description: "Supported: .md, .txt, .pdf, .docx",
        variant: "destructive",
      })
      return
    }

    setDirectUploading(true)
    setDirectUploadProgress(0)

    try {
      // Get presigned URL
      const { uploadUrl, docId, title } = await getUploadUrl(file.name)

      // Upload directly to S3
      await uploadFileToS3(file, uploadUrl, (progress) => {
        setDirectUploadProgress(progress)
      })

      toast({
        title: "Upload Complete",
        description: `"${title}" (${docId}) uploaded and queued for processing`,
      })

      // Refresh document list after a short delay to allow processing
      setTimeout(() => {
        refreshDocs()
      }, 2000)

    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setDirectUploading(false)
      setDirectUploadProgress(null)
      event.target.value = ''
    }
  }

  const handleAddToPending = () => {
    if (!docId.trim() || !docTitle.trim() || !docContent.trim()) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      })
      return
    }

    setPendingDocs((prev) => [...prev, { id: docId, title: docTitle, content: docContent }])
    setDocId("")
    setDocTitle("")
    setDocContent("")

    toast({
      title: "Document Added",
      description: "Document added to pending list",
    })
  }

  const handleRemovePending = (id: string) => {
    setPendingDocs((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleIngestAll = async () => {
    if (pendingDocs.length === 0) {
      toast({
        title: "No Documents",
        description: "Add documents to the pending list first",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await ingestDocuments(pendingDocs)
      toast({
        title: "Success",
        description: `${pendingDocs.length} document(s) ingested successfully`,
      })
      setPendingDocs([])
      // Refresh the document list
      await refreshDocs()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to ingest documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    setDeleteLoading(docId)
    try {
      await deleteDocument(docId)
      toast({
        title: "Deleted",
        description: `Document "${docId}" deleted successfully`,
      })
      await refreshDocs()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete document",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleOpenEditDialog = async (doc: DocumentInfo) => {
    setEditDoc({ docId: doc.docId, title: doc.title, content: "" })
    setEditDialogOpen(true)
    setContentLoading(true)

    try {
      const result = await getDocumentContent(doc.docId)
      setEditDoc({ docId: doc.docId, title: result.title, content: result.content })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load document content",
        variant: "destructive",
      })
    } finally {
      setContentLoading(false)
    }
  }

  const handleEditDocument = async () => {
    if (!editDoc || !editDoc.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Content is required",
        variant: "destructive",
      })
      return
    }

    setEditLoading(true)
    try {
      await ingestDocuments([{ id: editDoc.docId, title: editDoc.title, content: editDoc.content }])
      toast({
        title: "Updated",
        description: `Document "${editDoc.title}" updated successfully`,
      })
      setEditDialogOpen(false)
      setEditDoc(null)
      await refreshDocs()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update document",
        variant: "destructive",
      })
    } finally {
      setEditLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-bg-0">
      <div className="px-4 pt-4">
        <FloatingHeader />
      </div>

      <main className="flex flex-col items-center px-4 py-8 md:py-12">
        {/* Logo */}
        <div className="w-16 h-16 mb-6 flex items-center justify-center">
          <Icons.Logo className="w-full h-full" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-serif font-light text-text-200 mb-3 tracking-tight text-center">
          Manage Your{" "}
          <span className="relative inline-block pb-2">
            Documents
            <svg
              className="absolute w-[110%] h-[20px] -bottom-1 -left-[5%] text-accent"
              viewBox="0 0 140 24"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M6 16 Q 70 24, 134 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </span>
        </h1>

        <p className="text-text-300 mb-10 text-center">Add documents to your knowledge base</p>

        {/* Cards Grid */}
        <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-2">
          {/* Add Document Card */}
          <Card className="border-bg-300 bg-bg-100">
            <CardHeader>
              <CardTitle className="text-text-100">Add Document</CardTitle>
              <CardDescription className="text-text-400">Enter document details to add to pending list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Direct S3 Upload */}
              <div className="p-4 rounded-lg border border-dashed border-accent/50 bg-accent/5">
                <div className="flex items-center gap-2 mb-2">
                  <CloudUpload className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium text-text-100">Quick Upload</span>
                  <span className="text-xs text-text-400">(Recommended)</span>
                </div>
                <p className="text-xs text-text-400 mb-3">Upload directly to S3 for instant processing</p>
                <input
                  type="file"
                  id="direct-upload"
                  accept=".md,.txt,.pdf,.docx"
                  onChange={handleDirectUpload}
                  className="hidden"
                  disabled={directUploading}
                />
                <label
                  htmlFor="direct-upload"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 cursor-pointer rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors ${directUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {directUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading... {directUploadProgress}%
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      Upload file (.txt, .md, .pdf, .docx)
                    </>
                  )}
                </label>
                {directUploading && (
                  <div className="mt-2 h-1.5 bg-bg-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${directUploadProgress || 0}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-bg-300" />
                <span className="px-3 text-xs text-text-400">or add manually</span>
                <div className="flex-grow border-t border-bg-300" />
              </div>

              {/* File Load (for manual editing) */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  accept=".md,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 flex-1 px-4 py-2 cursor-pointer rounded-lg border border-bg-300 hover:bg-accent hover:border-accent hover:text-white transition-colors text-sm text-text-300"
                >
                  <Upload className="w-4 h-4" />
                  Load file into form
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setDocId("")
                    setDocTitle("")
                    setDocContent("")
                  }}
                  className="px-4 py-2 rounded-lg border border-bg-300 hover:bg-accent hover:border-accent hover:text-white transition-colors text-sm text-text-300"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-id" className="text-text-200">
                  Document ID
                </Label>
                <Input
                  id="doc-id"
                  placeholder="doc-001"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  className="border-bg-300 bg-bg-0 text-text-100 placeholder:text-text-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-title" className="text-text-200">
                  Title
                </Label>
                <Input
                  id="doc-title"
                  placeholder="Document title"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="border-bg-300 bg-bg-0 text-text-100 placeholder:text-text-400"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="doc-content" className="text-text-200">
                    Content
                  </Label>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="p-1 rounded hover:bg-bg-200 text-text-400 hover:text-text-100 transition-colors"
                    title="Expand editor"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
                <Textarea
                  id="doc-content"
                  placeholder="Document content..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  rows={4}
                  className="resize-none border-bg-300 bg-bg-0 text-text-100 placeholder:text-text-400 h-[100px] overflow-y-auto"
                />
              </div>

              {/* Expanded Content Modal */}
              {isExpanded && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                  onClick={(e) => e.target === e.currentTarget && setIsExpanded(false)}
                >
                  <div className="w-[90vw] h-[85vh] bg-bg-0 rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-bg-300">
                      <Label className="text-text-200 text-lg font-medium">Content Editor</Label>
                      <button
                        type="button"
                        onClick={() => setIsExpanded(false)}
                        className="p-2 rounded-lg hover:bg-bg-200 text-text-400 hover:text-text-100 transition-colors"
                        title="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 p-4">
                      <Textarea
                        autoFocus
                        placeholder="Document content..."
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        className="resize-none border-bg-300 bg-bg-100 text-text-100 placeholder:text-text-400 h-full w-full text-base"
                      />
                    </div>
                    <div className="p-4 border-t border-bg-300 flex justify-end">
                      <Button
                        onClick={() => setIsExpanded(false)}
                        className="bg-accent hover:bg-accent-hover text-white"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddToPending}
                className="w-full bg-accent hover:bg-accent-hover text-white"
                size="lg"
              >
                Add to Pending
              </Button>
            </CardContent>
          </Card>

          {/* Pending Documents Card */}
          <Card className="border-bg-300 bg-bg-100">
            <CardHeader>
              <CardTitle className="text-text-100">Pending Documents ({pendingDocs.length})</CardTitle>
              <CardDescription className="text-text-400">Documents ready to be ingested</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingDocs.length === 0 ? (
                <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-bg-300">
                  <p className="text-sm text-text-400">No pending documents</p>
                </div>
              ) : (
                <>
                  <div className="max-h-80 space-y-3 overflow-y-auto custom-scrollbar">
                    {pendingDocs.map((doc) => (
                      <div key={doc.id} className="group relative rounded-lg border border-bg-300 bg-bg-200/50 p-4">
                        <button
                          onClick={() => handleRemovePending(doc.id)}
                          className="absolute right-2 top-2 rounded-md p-1 text-text-400 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          aria-label="Remove document"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="space-y-2 pr-8">
                          <h4 className="font-semibold text-sm text-text-100">{doc.title}</h4>
                          <p className="text-xs text-text-400">ID: {doc.id}</p>
                          <p className="text-xs text-text-300 line-clamp-2">{doc.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleIngestAll}
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent-hover text-white"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ingesting...
                      </>
                    ) : (
                      `Ingest All ${pendingDocs.length} Document${pendingDocs.length > 1 ? "s" : ""}`
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ingested Documents Section */}
        <Card className="w-full max-w-5xl mt-8 border-bg-300 bg-bg-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-text-100">Ingested Documents ({ingestedDocs.length})</CardTitle>
              <CardDescription className="text-text-400">Documents stored in your knowledge base</CardDescription>
            </div>
            <Button
              onClick={() => refreshDocs()}
              variant="outline"
              size="sm"
              disabled={listLoading}
              className="border-bg-300 text-text-200 hover:bg-bg-200"
            >
              {listLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {listLoading && ingestedDocs.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : ingestedDocs.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-bg-300">
                <p className="text-sm text-text-400">No documents ingested yet</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {ingestedDocs.map((doc) => (
                  <div key={doc.docId} className="group relative rounded-lg border border-bg-300 bg-bg-200/50 p-4">
                    <div className="space-y-2 pr-16">
                      <h4 className="font-semibold text-sm text-text-100 truncate">{doc.title}</h4>
                      <p className="text-xs text-text-400">ID: {doc.docId}</p>
                      <p className="text-xs text-text-300">{doc.chunkCount} chunk{doc.chunkCount > 1 ? "s" : ""}</p>
                    </div>
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                      <Button
                        onClick={() => handleOpenEditDialog(doc)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-text-400 hover:bg-bg-300 hover:text-text-200"
                        aria-label="Edit document"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteDocument(doc.docId)}
                        variant="ghost"
                        size="sm"
                        disabled={deleteLoading === doc.docId}
                        className="h-8 w-8 p-0 text-text-400 hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete document"
                      >
                        {deleteLoading === doc.docId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main >

      {/* Edit Document Dialog */}
      < EditDocumentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        editDoc={editDoc}
        setEditDoc={setEditDoc}
        contentLoading={contentLoading}
        editLoading={editLoading}
        onSubmit={handleEditDocument}
      />

      <Toaster />
    </div >
  )
}
