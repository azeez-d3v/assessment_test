"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface EditDocumentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editDoc: { docId: string; title: string; content: string } | null
    setEditDoc: React.Dispatch<React.SetStateAction<{ docId: string; title: string; content: string } | null>>
    contentLoading: boolean
    editLoading: boolean
    onSubmit: () => void
}

export function EditDocumentDialog({
    open,
    onOpenChange,
    editDoc,
    setEditDoc,
    contentLoading,
    editLoading,
    onSubmit,
}: EditDocumentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-bg-100 border-bg-300 sm:max-w-lg max-h-[60vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-text-100">Edit Document</DialogTitle>
                    <DialogDescription className="text-text-400">
                        Update the content for &quot;{editDoc?.title}&quot;. This will replace the existing content.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col flex-1 py-4 px-1 gap-5 overflow-hidden">
                    <div className="space-y-2 flex-none">
                        <Label htmlFor="edit-title" className="text-text-200">Title</Label>
                        <Input
                            id="edit-title"
                            value={editDoc?.title || ""}
                            onChange={(e) => setEditDoc(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="border-bg-300 bg-bg-0 text-text-100 rounded-xl"
                            disabled={contentLoading}
                        />
                    </div>
                    <div className="space-y-2 flex flex-col flex-1 min-h-0">
                        <Label htmlFor="edit-content" className="text-text-200">Content</Label>
                        {contentLoading ? (
                            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-bg-300 bg-bg-0">
                                <div className="flex items-center gap-2 text-text-400">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Loading content...</span>
                                </div>
                            </div>
                        ) : (
                            <Textarea
                                id="edit-content"
                                placeholder="Enter the updated document content..."
                                value={editDoc?.content || ""}
                                onChange={(e) => setEditDoc(prev => prev ? { ...prev, content: e.target.value } : null)}
                                className="flex-1 resize-none border-bg-300 bg-bg-0 text-text-100 placeholder:text-text-400 rounded-xl p-4"
                            />
                        )}
                    </div>
                </div>
                <DialogFooter className="px-1">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-bg-300 text-text-200 hover:bg-bg-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={editLoading}
                        className="bg-accent hover:bg-accent-hover text-white"
                    >
                        {editLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Document"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
