"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Plus, ChevronDown, ArrowUp, X, FileText, Loader2, Check, Archive } from "lucide-react"
import Image from "next/image"

/* --- ICONS --- */
export const Icons = {
  Logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="presentation" {...props}>
      <defs>
        <ellipse id="petal-pair" cx="100" cy="100" rx="90" ry="22" />
      </defs>
      <g fill="#D46B4F" fillRule="evenodd">
        <use href="#petal-pair" transform="rotate(0 100 100)" />
        <use href="#petal-pair" transform="rotate(45 100 100)" />
        <use href="#petal-pair" transform="rotate(90 100 100)" />
        <use href="#petal-pair" transform="rotate(135 100 100)" />
      </g>
    </svg>
  ),
  Plus,
  Thinking: (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M10.3857 2.50977C14.3486 2.71054 17.5 5.98724 17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 9.72386 2.72386 9.5 3 9.5C3.27614 9.5 3.5 9.72386 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.5225 13.7691 3.68312 10.335 3.50879L10 3.5L9.89941 3.49023C9.67145 3.44371 9.5 3.24171 9.5 3C9.5 2.72386 9.72386 2.5 10 2.5L10.3857 2.50977ZM10 5.5C10.2761 5.5 10.5 5.72386 10.5 6V9.69043L13.2236 11.0527C13.4706 11.1762 13.5708 11.4766 13.4473 11.7236C13.3392 11.9397 13.0957 12.0435 12.8711 11.9834L12.7764 11.9473L9.77637 10.4473C9.60698 10.3626 9.5 10.1894 9.5 10V6C9.5 5.72386 9.72386 5.5 10 5.5ZM3.66211 6.94141C4.0273 6.94159 4.32303 7.23735 4.32324 7.60254C4.32324 7.96791 4.02743 8.26446 3.66211 8.26465C3.29663 8.26465 3 7.96802 3 7.60254C3.00021 7.23723 3.29676 6.94141 3.66211 6.94141ZM4.95605 4.29395C5.32146 4.29404 5.61719 4.59063 5.61719 4.95605C5.6171 5.3214 5.3214 5.61709 4.95605 5.61719C4.59063 5.61719 4.29403 5.32146 4.29395 4.95605C4.29395 4.59057 4.59057 4.29395 4.95605 4.29395ZM7.60254 3C7.96802 3 8.26465 3.29663 8.26465 3.66211C8.26446 4.02743 7.96791 4.32324 7.60254 4.32324C7.23736 4.32302 6.94159 4.0273 6.94141 3.66211C6.94141 3.29676 7.23724 3.00022 7.60254 3Z" />
    </svg>
  ),
  SelectArrow: ChevronDown,
  ArrowUp,
  X,
  FileText,
  Loader2,
  Check,
  Archive,
}

/* --- TYPES --- */
interface AttachedFile {
  id: string
  file: File
  type: string
  preview: string | null
  uploadStatus: string
}

interface PastedContent {
  id: string
  content: string
  timestamp: Date
}

interface Model {
  id: string
  name: string
  description: string
}

/* --- FILE PREVIEW CARD --- */
function FilePreviewCard({ file, onRemove }: { file: AttachedFile; onRemove: (id: string) => void }) {
  const isImage = file.type.startsWith("image/") && file.preview

  return (
    <div className="relative group flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-bg-300 bg-bg-200 transition-all hover:border-text-400">
      {isImage ? (
        <div className="w-full h-full relative">
          <Image
            src={file.preview! || "/placeholder.svg"}
            alt={file.file.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        </div>
      ) : (
        <div className="w-full h-full p-3 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-bg-300 rounded">
              <Icons.FileText className="w-4 h-4 text-text-300" />
            </div>
            <span className="text-[10px] font-medium text-text-400 uppercase tracking-wider truncate">
              {file.file.name.split(".").pop()}
            </span>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-text-200 truncate" title={file.file.name}>
              {file.file.name}
            </p>
          </div>
        </div>
      )}
      <button
        onClick={() => onRemove(file.id)}
        className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Icons.X className="w-3 h-3" />
      </button>
      {file.uploadStatus === "uploading" && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Icons.Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}
    </div>
  )
}

/* --- PASTED CONTENT CARD --- */
function PastedContentCard({ content, onRemove }: { content: PastedContent; onRemove: (id: string) => void }) {
  return (
    <div className="relative group flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-bg-300 bg-bg-100 p-3 flex flex-col justify-between shadow-sm">
      <div className="overflow-hidden w-full">
        <p className="text-[10px] text-text-400 leading-[1.4] font-mono break-words whitespace-pre-wrap line-clamp-4 select-none">
          {content.content}
        </p>
      </div>
      <div className="flex items-center justify-between w-full mt-2">
        <div className="inline-flex items-center justify-center px-1.5 py-[2px] rounded border border-bg-300 bg-bg-100">
          <span className="text-[9px] font-bold text-text-400 uppercase tracking-wider">PASTED</span>
        </div>
      </div>
      <button
        onClick={() => onRemove(content.id)}
        className="absolute top-2 right-2 p-[3px] bg-bg-100 border border-bg-300 rounded-full text-text-400 hover:text-text-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
      >
        <Icons.X className="w-2 h-2" />
      </button>
    </div>
  )
}

/* --- MODEL SELECTOR --- */
function ModelSelector({
  models,
  selectedModel,
  onSelect,
}: {
  models: Model[]
  selectedModel: string
  onSelect: (modelId: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const currentModel = models.find((m) => m.id === selectedModel) || models[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center relative shrink-0 transition duration-300 h-8 rounded-xl px-3 min-w-[4rem] active:scale-[0.98] whitespace-nowrap text-xs pl-2.5 pr-2 gap-1 
          ${isOpen ? "bg-bg-200 text-text-100" : "text-text-300 hover:text-text-200 hover:bg-bg-200"}`}
      >
        <div className="inline-flex gap-[3px] text-[14px] h-[14px] leading-none items-baseline">
          <div className="whitespace-nowrap select-none font-medium">{currentModel.name}</div>
        </div>
        <Icons.SelectArrow
          className={`shrink-0 w-4 h-4 opacity-75 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-[260px] bg-bg-100 border border-bg-300 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col p-1.5 animate-fade-in origin-bottom-right">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id)
                setIsOpen(false)
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl flex items-start justify-between group transition-colors hover:bg-bg-200"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-text-100">{model.name}</span>
                <span className="text-[11px] text-text-300">{model.description}</span>
              </div>
              {selectedModel === model.id && <Icons.Check className="w-4 h-4 text-accent mt-1" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* --- MAIN CHAT INPUT --- */
interface ClaudeChatInputProps {
  placeholder?: string
  onSendMessage: (data: { message: string; model: string }) => void
  documentCount?: number | null
  isLoading?: boolean
}

export function ClaudeChatInput({ placeholder = "How can I help you today?", onSendMessage, documentCount = 0, isLoading = false }: ClaudeChatInputProps) {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<AttachedFile[]>([])
  const [pastedContent, setPastedContent] = useState<PastedContent[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedModel, setSelectedModel] = useState("auto")
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate dynamic models based on document count
  const models: Model[] = []

  // Handle null as loading (effectively 0 for logic but distinct for UI)
  const safeCount = documentCount ?? 0

  if (safeCount > 0) {
    models.push({ id: "auto", name: "Auto", description: `Smart: uses ${Math.min(3, safeCount)} sources` })
    models.push({ id: "1-source", name: "1 source", description: "Retrieve 1 relevant document" })

    // Add more options based on document count
    if (safeCount >= 2) {
      models.push({ id: "2-sources", name: "2 sources", description: "Retrieve 2 relevant documents" })
    }
    if (safeCount >= 3) {
      models.push({ id: "3-sources", name: "3 sources", description: "Retrieve 3 relevant documents" })
    }
    if (safeCount >= 5) {
      models.push({ id: "5-sources", name: "5 sources", description: "Retrieve 5 relevant documents" })
    }
    if (safeCount >= 10) {
      models.push({ id: "10-sources", name: "10 sources", description: "Retrieve up to 10 documents" })
    }
  } else {
    // Default for 0 documents (or null/loading which will result in no warning but default model)
    models.push({ id: "auto", name: "General Knowledge", description: "No documents available" })
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 384) + "px"
    }
  }, [message])

  const handleFiles = useCallback((newFilesList: FileList | File[]) => {
    const newFiles = Array.from(newFilesList).map((file) => {
      const isImage = file.type.startsWith("image/")
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: isImage ? "image/unknown" : file.type || "application/octet-stream",
        preview: isImage ? URL.createObjectURL(file) : null,
        uploadStatus: "pending",
      }
    })
    setFiles((prev) => [...prev, ...newFiles])
    newFiles.forEach((f) => {
      setTimeout(
        () => {
          setFiles((prev) => prev.map((p) => (p.id === f.id ? { ...p, uploadStatus: "complete" } : p)))
        },
        800 + Math.random() * 1000,
      )
    })
  }, [])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const pastedFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile()
        if (file) pastedFiles.push(file)
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault()
      handleFiles(pastedFiles)
      return
    }
    const text = e.clipboardData.getData("text")
    if (text.length > 300) {
      e.preventDefault()
      setPastedContent((prev) => [
        ...prev,
        { id: Math.random().toString(36).substr(2, 9), content: text, timestamp: new Date() },
      ])
    }
  }

  const handleSend = () => {
    if (isLoading) return // Block sending while loading
    if (!message.trim() && files.length === 0 && pastedContent.length === 0) return
    onSendMessage({ message, model: selectedModel })
    setMessage("")
    setFiles([])
    setPastedContent([])
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasContent = message.trim() || files.length > 0 || pastedContent.length > 0

  return (
    <div
      className="relative w-full max-w-2xl mx-auto transition-all duration-300"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Warning Banner for No Documents - Positioned outside and overlapping */}
      <div
        className={`px-3 md:px-2 relative z-0 transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] origin-bottom ${documentCount === 0
          ? "opacity-100 max-h-[100px] translate-y-0"
          : "opacity-0 max-h-0 translate-y-2 pointer-events-none"
          }`}
      >
        <div style={{ height: 'auto' }}>
          <div className="w-full border-0.5 relative z-[5] px-3.5 -mb-2 rounded-t-xl border-b-0 pb-3 pt-2 bg-[#F2F0E9] border-transparent">
            <div className="w-full">
              <div className="flex w-full flex-col items-center md:flex-row gap-2">
                <div className="flex flex-row items-center gap-2 md:w-full text-[#5E5B54]">
                  <div>
                    <div className="text-[13px]">
                      No documents found. Using <span className="underline underline-offset-[3px] decoration-[color-mix(in_srgb,currentColor,transparent_60%)]">general knowledge</span> only.
                    </div>
                  </div>
                </div>
                <div className="-mt-px w-full whitespace-nowrap md:w-fit">
                  <a
                    href="/docs"
                    className="inline underline underline-offset-[3px] decoration-[color-mix(in_srgb,currentColor,transparent_60%)] hover:decoration-current cursor-pointer text-[13px] font-medium text-[#5E5B54]"
                  >
                    Upload Docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex flex-col mx-2 md:mx-0 items-stretch transition-all duration-200 relative z-10 rounded-2xl cursor-text border shadow-[0_0_15px_rgba(0,0,0,0.08)] hover:shadow-[0_0_20px_rgba(0,0,0,0.12)] focus-within:shadow-[0_0_25px_rgba(0,0,0,0.15)] bg-bg-100 ${documentCount === 0 ? "border-[#E5E3DC]" : "border-bg-300"
        }`}>

        <div className="flex flex-col px-3 pt-3 pb-2 gap-2">
          {(files.length > 0 || pastedContent.length > 0) && (
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-1">
              {pastedContent.map((content) => (
                <PastedContentCard
                  key={content.id}
                  content={content}
                  onRemove={(id) => setPastedContent((prev) => prev.filter((c) => c.id !== id))}
                />
              ))}
              {files.map((file) => (
                <FilePreviewCard
                  key={file.id}
                  file={file}
                  onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
                />
              ))}
            </div>
          )}

          <div className="relative mb-1">
            <div className="max-h-96 w-full overflow-y-auto custom-scrollbar break-words transition-opacity duration-200 min-h-[2.5rem] pl-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full bg-transparent border-0 outline-none text-text-100 text-[16px] placeholder:text-text-400 resize-none overflow-hidden py-0 leading-relaxed block font-normal"
                rows={1}
                autoFocus
                style={{ minHeight: "1.5em" }}
              />
            </div>
          </div>

          <div className="flex gap-2 w-full items-center">
            <div className="relative flex-1 flex items-center shrink min-w-0 gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center relative shrink-0 transition-colors duration-200 h-8 w-8 rounded-lg active:scale-95 text-text-400 hover:text-text-200 hover:bg-bg-200"
                type="button"
                aria-label="Attach file"
              >
                <Icons.Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                className={`transition-all duration-200 h-8 w-8 flex items-center justify-center rounded-lg active:scale-95 ${isThinkingEnabled ? "text-accent bg-accent/10" : "text-text-400 hover:text-text-200 hover:bg-bg-200"}`}
                aria-pressed={isThinkingEnabled}
                aria-label="Extended thinking"
              >
                <Icons.Thinking className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-row items-center min-w-0 gap-1">
              {(documentCount ?? 0) > 0 && (
                <ModelSelector models={models} selectedModel={selectedModel} onSelect={setSelectedModel} />
              )}
              <button
                onClick={handleSend}
                disabled={!hasContent || isLoading}
                className={`inline-flex items-center justify-center relative shrink-0 transition-colors h-8 w-8 rounded-xl active:scale-95 ${hasContent && !isLoading ? "bg-accent text-white hover:bg-accent-hover shadow-md" : "bg-accent/30 text-white/60 cursor-default"}`}
                type="button"
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icons.ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-bg-200/90 border-2 border-dashed border-accent rounded-2xl z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
          <Icons.Archive className="w-10 h-10 text-accent mb-2 animate-bounce" />
          <p className="text-accent font-medium">Drop files to upload</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
          e.target.value = ""
        }}
      />

      <div className="text-center mt-4">
        <p className="text-xs text-text-500">AI can make mistakes. Please check important information.</p>
      </div>
    </div>
  )
}

export default ClaudeChatInput
