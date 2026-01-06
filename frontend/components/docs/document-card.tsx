"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Pencil } from "lucide-react"
import { DocumentInfo } from "@/lib/api"

// SVG Icons for extraction methods
const AzureIcon = () => (
    <svg className="w-3 h-3" viewBox="0 0 96 96">
        <defs>
            <linearGradient id="azure__a" x1="-1032.17" x2="-1059.21" y1="145.31" y2="65.43" gradientTransform="matrix(1 0 0 -1 1075 158)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#114a8b" />
                <stop offset="1" stopColor="#0669bc" />
            </linearGradient>
            <linearGradient id="azure__c" x1="-1027.16" x2="-997.48" y1="147.64" y2="68.56" gradientTransform="matrix(1 0 0 -1 1075 158)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#3ccbf4" />
                <stop offset="1" stopColor="#2892df" />
            </linearGradient>
        </defs>
        <path fill="url(#azure__a)" d="M33.34 6.54h26.04l-27.03 80.1a4.15 4.15 0 0 1-3.94 2.81H8.15a4.14 4.14 0 0 1-3.93-5.47L29.4 9.38a4.15 4.15 0 0 1 3.94-2.83z" />
        <path fill="#0078d4" d="M71.17 60.26H29.88a1.91 1.91 0 0 0-1.3 3.31l26.53 24.76a4.17 4.17 0 0 0 2.85 1.13h23.38z" />
        <path fill="url(#azure__c)" d="M66.6 9.36a4.14 4.14 0 0 0-3.93-2.82H33.65a4.15 4.15 0 0 1 3.93 2.82l25.18 74.62a4.15 4.15 0 0 1-3.93 5.48h29.02a4.15 4.15 0 0 0 3.93-5.48z" />
    </svg>
)

const TextractIcon = () => (
    <svg className="w-3 h-3" viewBox="0 0 304 182">
        <path fill="#252f3e" d="m86 66 2 9c0 3 1 5 3 8v2l-1 3-7 4-2 1-3-1-4-5-3-6c-8 9-18 14-29 14-9 0-16-3-20-8-5-4-8-11-8-19s3-15 9-20c6-6 14-8 25-8a79 79 0 0 1 22 3v-7c0-8-2-13-5-16-3-4-8-5-16-5l-11 1a80 80 0 0 0-14 5h-2c-1 0-2-1-2-3v-5l1-3c0-1 1-2 3-2l12-5 16-2c12 0 20 3 26 8 5 6 8 14 8 25v32zM46 82l10-2c4-1 7-4 10-7l3-6 1-9v-4a84 84 0 0 0-19-2c-6 0-11 1-15 4-3 2-4 6-4 11s1 8 3 11c3 2 6 4 11 4zm80 10-4-1-2-3-23-78-1-4 2-2h10l4 1 2 4 17 66 15-66 2-4 4-1h8l4 1 2 4 16 67 17-67 2-4 4-1h9c2 0 3 1 3 2v2l-1 2-24 78-2 4-4 1h-9l-4-1-1-4-16-65-15 64-2 4-4 1h-9zm129 3a66 66 0 0 1-27-6l-3-3-1-2v-5c0-2 1-3 2-3h2l3 1a54 54 0 0 0 23 5c6 0 11-2 14-4 4-2 5-5 5-9l-2-7-10-5-15-5c-7-2-13-6-16-10a24 24 0 0 1 5-34l10-5a44 44 0 0 1 20-2 110 110 0 0 1 12 3l4 2 3 2 1 4v4c0 3-1 4-2 4l-4-2c-6-2-12-3-19-3-6 0-11 0-14 2s-4 5-4 9c0 3 1 5 3 7s5 4 11 6l14 4c7 3 12 6 15 10s5 9 5 14l-3 12-7 8c-3 3-7 5-11 6l-14 2z" />
        <path d="M274 144A220 220 0 0 1 4 124c-4-3-1-6 2-4a300 300 0 0 0 263 16c5-2 10 4 5 8z" fill="#f90" />
        <path d="M287 128c-4-5-28-3-38-1-4 0-4-3-1-5 19-13 50-9 53-5 4 5-1 36-18 51-3 2-6 1-5-2 5-10 13-33 9-38z" fill="#f90" />
    </svg>
)

const FallbackIcon = () => (
    <svg className="w-3 h-3" fill="currentColor" fillRule="evenodd" viewBox="0 0 24 24">
        <path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z" />
        <path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z" />
    </svg>
)

interface DocumentCardProps {
    doc: DocumentInfo
    onEdit: (doc: DocumentInfo) => void
    onDelete: (docId: string) => void
    deleteLoading: string | null
}

export function DocumentCard({ doc, onEdit, onDelete, deleteLoading }: DocumentCardProps) {
    const getExtractionMethodBadge = () => {
        if (!doc.extractionMethod) return null

        const badgeClass = doc.extractionMethod === 'azure'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : doc.extractionMethod === 'textract'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                : doc.extractionMethod === 'mammoth'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'

        const label = doc.extractionMethod === 'azure' ? 'Azure'
            : doc.extractionMethod === 'textract' ? 'Textract'
                : doc.extractionMethod === 'mammoth' ? 'Mammoth'
                    : doc.extractionMethod === 'pdf-parse' ? 'PDF Parse'
                        : doc.extractionMethod === 'text' ? 'Text'
                            : doc.extractionMethod

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}>
                {doc.extractionMethod === 'azure' && <AzureIcon />}
                {doc.extractionMethod === 'textract' && <TextractIcon />}
                {(doc.extractionMethod === 'pdf-parse' || doc.extractionMethod === 'mammoth' || doc.extractionMethod === 'text') && <FallbackIcon />}
                {label}
            </span>
        )
    }

    const getChunkingStrategyBadge = () => {
        if (!doc.chunkingStrategy) return null

        const badgeClass = doc.chunkingStrategy === 'recursive'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}>
                {doc.chunkingStrategy === 'recursive' ? 'Recursive' : 'Fixed'}
            </span>
        )
    }

    return (
        <div className="group relative rounded-lg border border-bg-300 bg-bg-200/50 p-4">
            <div className="space-y-2 pr-16">
                <h4 className="font-semibold text-sm text-text-100 truncate">{doc.title}</h4>
                <p className="text-xs text-text-400">ID: {doc.docId}</p>
                <p className="text-xs text-text-300">{doc.chunkCount} chunk{doc.chunkCount > 1 ? "s" : ""}</p>
                {/* Metadata Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {getExtractionMethodBadge()}
                    {getChunkingStrategyBadge()}
                </div>
            </div>
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
                <Button
                    onClick={() => onEdit(doc)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-text-400 hover:bg-bg-300 hover:text-text-200"
                    aria-label="Edit document"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    onClick={() => onDelete(doc.docId)}
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
    )
}
