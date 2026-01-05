"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileText, Loader2 } from "lucide-react"
import { ChunkingStrategy } from "@/lib/api"

interface UploadSettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    file: File | null
    chunkingStrategy: ChunkingStrategy
    onStrategyChange: (strategy: ChunkingStrategy) => void
    onConfirm: () => void
    isUploading: boolean
}

export function UploadSettingsDialog({
    open,
    onOpenChange,
    file,
    chunkingStrategy,
    onStrategyChange,
    onConfirm,
    isUploading,
}: UploadSettingsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Upload Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure how your document will be processed
                    </DialogDescription>
                </DialogHeader>

                {file && (
                    <div className="py-4 space-y-4">
                        {/* File info */}
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>

                        {/* Chunking strategy selection */}
                        <div className="space-y-3">
                            <Label className="text-base font-medium">Chunking Strategy</Label>
                            <RadioGroup
                                value={chunkingStrategy}
                                onValueChange={(value) => onStrategyChange(value as ChunkingStrategy)}
                                className="space-y-3"
                            >
                                <div
                                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => onStrategyChange('recursive')}
                                >
                                    <RadioGroupItem value="recursive" id="recursive" className="mt-0.5 cursor-pointer" />
                                    <div className="space-y-1">
                                        <Label htmlFor="recursive" className="font-medium cursor-pointer">
                                            Smart Recursive
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Splits at paragraph and sentence boundaries. Best for articles, FAQs, and policies.
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => onStrategyChange('fixed')}
                                >
                                    <RadioGroupItem value="fixed" id="fixed" className="mt-0.5 cursor-pointer" />
                                    <div className="space-y-1">
                                        <Label htmlFor="fixed" className="font-medium cursor-pointer">
                                            Fixed-Size (500 chars)
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Consistent chunk sizes with overlap. Best for dense technical docs or code.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isUploading}
                        className="hover:bg-bg-200 hover:text-text-100 cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={isUploading} className="cursor-pointer">
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Upload"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
