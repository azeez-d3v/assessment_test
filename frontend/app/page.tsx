"use client"

import { useState, useEffect, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { ClaudeChatInput, Icons } from "@/components/ui/claude-style-chat-input"
import { ShiningText } from "@/components/ui/shining-text"
import { askQuestion, listDocuments } from "@/lib/api"
import { Copy, RotateCcw } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Array<{ docId: string; title: string }>
  isLoading?: boolean
  error?: string
  userQuestion?: string // For retry functionality
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [documentCount, setDocumentCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch document count on mount
  useEffect(() => {
    listDocuments()
      .then((result) => setDocumentCount(result.documents?.length || 0))
      .catch(() => setDocumentCount(0))
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async (data: { message: string; model: string }) => {
    if (!data.message.trim()) return

    // Trigger the transition
    if (!hasStarted) {
      setHasStarted(true)
    }

    const userMessageId = Math.random().toString(36).substr(2, 9)
    const assistantMessageId = Math.random().toString(36).substr(2, 9)

    // Add user message
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: data.message,
    }

    // Add loading assistant message
    const loadingMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, loadingMessage])

    // Handle "auto" mode
    let topK: number
    if (data.model === "auto") {
      topK = Math.min(3, Math.max(1, documentCount))
    } else {
      topK = Number.parseInt(data.model.split("-")[0]) || 3
    }

    try {
      const result = await askQuestion(data.message, topK)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: result.answer, sources: result.sources || [], isLoading: false }
            : msg
        )
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, error: err instanceof Error ? err.message : "Failed to get answer", isLoading: false }
            : msg
        )
      )
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="flex flex-col h-screen bg-bg-0">
      <Navigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!hasStarted ? (
          // Initial centered state
          <div className="flex-1 flex flex-col items-center justify-center px-4 transition-all duration-500">
            <div className="w-16 h-16 mb-6 flex items-center justify-center animate-fade-in">
              <Icons.Logo className="w-full h-full" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-light text-text-200 mb-3 tracking-tight text-center animate-fade-in">
              What can I help you with?
            </h1>
            <p className="text-text-400 text-center max-w-md mb-8 animate-fade-in">
              Ask questions about your documents or anything else
            </p>
            <div className="w-full max-w-2xl animate-fade-in">
              <ClaudeChatInput
                placeholder="Ask anything..."
                onSendMessage={handleSendMessage}
                documentCount={documentCount}
              />
            </div>
          </div>
        ) : (
          // Chat mode with messages
          <>
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className="animate-fade-in">
                      {message.role === "user" ? (
                        // User message - right aligned
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-bg-200 rounded-2xl px-4 py-3">
                            <p className="text-text-100 font-[family-name:var(--font-lora)]">{message.content}</p>
                          </div>
                        </div>
                      ) : (
                        // Assistant message - left aligned
                        <div className="flex gap-3 group">
                          <div className="flex-shrink-0 w-8 h-8">
                            <Icons.Logo className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {message.isLoading ? (
                              <div className="flex items-center gap-2 py-2">
                                <ShiningText text="Thinking..." />
                              </div>
                            ) : message.error ? (
                              <div className="text-destructive py-2">
                                <p className="text-sm">{message.error}</p>
                              </div>
                            ) : (
                              <>
                                <div className="prose prose-sm max-w-none text-text-100 font-[family-name:var(--font-lora)] [&_p]:text-text-100 [&_p]:leading-7 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_strong]:text-text-50 [&_strong]:font-semibold [&_h1]:text-text-50 [&_h1]:text-xl [&_h1]:font-medium [&_h1]:mb-4 [&_h1]:mt-6 [&_h2]:text-text-50 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-text-50 [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4 [&_a]:text-accent hover:[&_a]:text-accent-hover [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1.5 [&_li]:marker:text-text-300">
                                  <ReactMarkdown>{message.content}</ReactMarkdown>
                                </div>

                                {/* Sources */}
                                {message.sources && message.sources.length > 0 && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {message.sources.map((source) => (
                                      <span
                                        key={source.docId}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-text-300 bg-bg-200 rounded-full border border-bg-300"
                                      >
                                        <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                                        {source.title}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => copyToClipboard(message.content)}
                                    className="p-1.5 text-text-400 hover:text-text-200 hover:bg-bg-200 rounded-md transition-colors"
                                    title="Copy"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Find the user message before this assistant message
                                      const msgIndex = messages.findIndex(m => m.id === message.id)
                                      if (msgIndex > 0) {
                                        const userMsg = messages[msgIndex - 1]
                                        if (userMsg.role === "user") {
                                          handleSendMessage({ message: userMsg.content, model: "auto" })
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-text-400 hover:text-text-200 hover:bg-bg-200 rounded-md transition-colors"
                                    title="Retry"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </main>

            {/* Fixed Chat Input at Bottom */}
            <div className="bg-bg-0">
              <div className="max-w-3xl mx-auto px-4 py-4">
                <ClaudeChatInput
                  placeholder="Reply..."
                  onSendMessage={handleSendMessage}
                  documentCount={documentCount}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
