"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { DocumentInfo } from "@/lib/api"
import { DocumentCard } from "./document-card"

interface IngestedDocumentsListProps {
    documents: DocumentInfo[]
    isLoading: boolean
    onRefresh: () => void
    onEdit: (doc: DocumentInfo) => void
    onDelete: (docId: string) => void
    deleteLoading: string | null
}

export function IngestedDocumentsList({
    documents,
    isLoading,
    onRefresh,
    onEdit,
    onDelete,
    deleteLoading,
}: IngestedDocumentsListProps) {
    return (
        <Card className="w-full max-w-5xl mt-8 border-bg-300 bg-bg-100">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-text-100">Ingested Documents ({documents.length})</CardTitle>
                    <CardDescription className="text-text-400">Documents stored in your knowledge base</CardDescription>
                </div>
                <Button
                    onClick={onRefresh}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="border-bg-300 text-text-200 hover:bg-bg-200"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading && documents.length === 0 ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-bg-300">
                        <p className="text-sm text-text-400">No documents ingested yet</p>
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {documents.map((doc) => (
                            <DocumentCard
                                key={doc.docId}
                                doc={doc}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                deleteLoading={deleteLoading}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
