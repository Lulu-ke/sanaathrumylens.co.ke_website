"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Search,
  X,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  altText: string | null
  createdAt: string
}

export default function MediaPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [uploading, setUploading] = useState(false)
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<MediaItem | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const { data: mediaData, isLoading } = useQuery<{ media: MediaItem[]; total: number }>({
    queryKey: ["media", search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/media?${params}`)
      if (!res.ok) throw new Error("Failed to fetch media")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      setDeleteItem(null)
      toast.success("Media deleted")
    },
    onError: () => toast.error("Failed to delete media"),
  })

  const uploadFiles = useCallback(async (files: FileList, folder: string = "misc") => {
    setUploading(true)
    let successCount = 0
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)
      try {
        const res = await fetch("/api/media", { method: "POST", body: formData })
        if (res.ok) successCount++
      } catch {
        // skip failed uploads
      }
    }
    queryClient.invalidateQueries({ queryKey: ["media"] })
    setUploading(false)
    if (successCount > 0) toast.success(`${successCount} file(s) uploaded`)
    else toast.error("No files uploaded")
  }, [queryClient])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
  }, [uploadFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragActive(false), [])

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copied to clipboard")
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Upload and manage images and files</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Drag and drop files here</p>
            <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
            <label>
              <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                <span>
                  <Upload className="size-3.5 mr-1" />
                  Select Files
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />
            </label>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : mediaData?.media && mediaData.media.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaData.media.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer overflow-hidden hover:shadow-md transition-shadow"
              onClick={() => setPreviewItem(item)}
            >
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  {item.mimeType.startsWith("image/") ? (
                    <img src={item.url} alt={item.altText || item.originalName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ImageIcon className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-8"
                      onClick={(e) => { e.stopPropagation(); copyUrl(item.url) }}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="size-8"
                      onClick={(e) => { e.stopPropagation(); setDeleteItem(item) }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-xs truncate font-medium">{item.originalName}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(item.size)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ImageIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p>No media files yet</p>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.originalName}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <img src={previewItem.url} alt={previewItem.altText || previewItem.originalName} className="w-full max-h-96 object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-article.svg' }} />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Size:</span> {formatSize(previewItem.size)}</div>
                <div><span className="text-muted-foreground">Type:</span> {previewItem.mimeType}</div>
                <div><span className="text-muted-foreground">Uploaded:</span> {formatDate(previewItem.createdAt)}</div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">URL:</span>{" "}
                  <span className="break-all text-xs">{previewItem.url}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => previewItem && copyUrl(previewItem.url)} className="gap-2">
              <Copy className="size-4" /> Copy URL
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (previewItem) { setDeleteItem(previewItem); setPreviewItem(null) } }}
              className="gap-2"
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteItem?.originalName}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
