"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Save,
  Send,
  Calendar,
  ArrowLeft,
  Loader2,
  ImageIcon,
  X,
  CheckCircle2,
  XCircle,
  History,
  CloudOff,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { SaveStatusIndicator } from "@/components/editor/save-status-indicator"
import { OfflineBanner } from "@/components/editor/offline-banner"
import { useAutoSave } from "@/hooks/use-auto-save"
import { useOnlineStatus } from "@/hooks/use-online-status"
import {
  getDraft,
  deleteDraft,
  type OfflineDraft,
} from "@/lib/offline-db"
import { toast } from "sonner"
import { format } from "date-fns"

interface PostData {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  status: string
  seoTitle: string | null
  seoDescription: string | null
  ogImage: string | null
  scheduledAt: string | null
  rejectedReason: string | null
  author: { id: string; name: string }
  categories: { category: { id: string; name: string; color: string | null } }[]
  tags: { tag: { id: string; name: string } }[]
}

interface Category {
  id: string
  name: string
  slug: string
  color: string | null
}
interface Tag {
  id: string
  name: string
  slug: string
}
interface Revision {
  id: string
  title: string
  changeNote: string | null
  version: number
  createdAt: string
  author: { name: string }
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [featuredImage, setFeaturedImage] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [ogImage, setOgImage] = useState("")
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [showRevisions, setShowRevisions] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // Draft recovery state
  const [draftRecovery, setDraftRecovery] = useState<OfflineDraft | null>(null)
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)
  const [postLoaded, setPostLoaded] = useState(false)

  // Generate a stable draft ID for this editing session based on postId
  const draftIdRef = useRef(`edit-post-${postId}`)

  const role = (session?.user?.role as string) || "AUTHOR"
  const canReview = ["SUPER_ADMIN", "ADMIN", "EDITOR"].includes(role)

  const { data: post, isLoading: postLoading } = useQuery<PostData>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}`)
      if (!res.ok) throw new Error("Failed to fetch post")
      return res.json()
    },
    enabled: !!postId,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch categories")
      return res.json()
    },
  })

  const { data: tags } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags")
      if (!res.ok) throw new Error("Failed to fetch tags")
      return res.json()
    },
  })

  const { data: revisions } = useQuery<Revision[]>({
    queryKey: ["revisions", postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}/revisions`)
      if (!res.ok) throw new Error("Failed to fetch revisions")
      return res.json()
    },
    enabled: !!postId,
  })

  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setSlug(post.slug)
      setExcerpt(post.excerpt || "")
      setContent(post.content)
      setFeaturedImage(post.featuredImage || "")
      setSelectedCategories(post.categories.map((c) => c.category.id))
      setSelectedTags(post.tags.map((t) => t.tag.id))
      setSeoTitle(post.seoTitle || "")
      setSeoDescription(post.seoDescription || "")
      setOgImage(post.ogImage || "")
      if (post.scheduledAt) setScheduledAt(new Date(post.scheduledAt))
      setPostLoaded(true)
    }
  }, [post])

  // Check for existing draft after post loads
  useEffect(() => {
    if (!postLoaded) return
    async function checkForDraft() {
      try {
        const draft = await getDraft(draftIdRef.current)
        if (draft && draft.data && Object.keys(draft.data).length > 0) {
          // Only show recovery if the draft is newer than the post data
          const d = draft.data
          if (d.title || d.content || d.excerpt) {
            setDraftRecovery(draft)
            setShowRecoveryBanner(true)
          }
        }
      } catch {
        // IndexedDB not available, that's fine
      }
    }
    checkForDraft()
  }, [postLoaded])

  // Restore draft
  const restoreDraft = () => {
    if (!draftRecovery?.data) return
    const d = draftRecovery.data
    if (d.title) setTitle(d.title as string)
    if (d.slug) setSlug(d.slug as string)
    if (d.excerpt) setExcerpt(d.excerpt as string)
    if (d.content) setContent(d.content as string)
    if (d.featuredImage) setFeaturedImage(d.featuredImage as string)
    if (d.selectedCategories)
      setSelectedCategories(d.selectedCategories as string[])
    if (d.selectedTags) setSelectedTags(d.selectedTags as string[])
    if (d.seoTitle) setSeoTitle(d.seoTitle as string)
    if (d.seoDescription) setSeoDescription(d.seoDescription as string)
    if (d.ogImage) setOgImage(d.ogImage as string)
    if (d.scheduledAt) setScheduledAt(new Date(d.scheduledAt as string))
    setShowRecoveryBanner(false)
    toast.success("Draft restored")
  }

  // Discard draft
  const discardDraft = async () => {
    try {
      await deleteDraft(draftIdRef.current)
    } catch {
      // Ignore
    }
    setDraftRecovery(null)
    setShowRecoveryBanner(false)
    toast.success("Draft discarded")
  }

  // Collect form state into a data object for auto-save
  const formData = useMemo(
    () => ({
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      selectedCategories,
      selectedTags,
      seoTitle,
      seoDescription,
      ogImage,
      scheduledAt: scheduledAt?.toISOString() ?? null,
    }),
    [
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      selectedCategories,
      selectedTags,
      seoTitle,
      seoDescription,
      ogImage,
      scheduledAt,
    ]
  )

  // Auto-save hook
  const { saveStatus, lastSavedAt, hasUnsavedChanges, saveNow } = useAutoSave({
    draftId: draftIdRef.current,
    entityType: "post",
    data: formData,
    interval: 30000,
    debounceMs: 2000,
    serverSaveUrl: `/api/posts/${postId}`,
    serverSaveMethod: "PATCH",
    entityId: postId,
    enabled: postLoaded,
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!isOnline) {
      toast.error("Cannot upload images while offline")
      return
    }

    const formDataUpload = new FormData()
    formDataUpload.append("file", file)
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        body: formDataUpload,
      })
      const data = await res.json()
      if (data.url) {
        setFeaturedImage(data.url)
        toast.success("Image uploaded")
      }
    } catch {
      toast.error("Failed to upload image")
    }
  }

  const handleSave = async (status: string) => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    // If offline, save locally and queue for sync
    if (!isOnline) {
      await saveNow()
      toast.info("Saved offline — will sync when you're back online")
      return
    }

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        title,
        slug,
        excerpt,
        content,
        featuredImage: featuredImage || undefined,
        status,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        ogImage: ogImage || undefined,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
      }
      if (status === "SCHEDULED" && scheduledAt) {
        body.scheduledAt = scheduledAt.toISOString()
      }
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save post")
      }

      // Clean up local draft after successful save
      try {
        await deleteDraft(draftIdRef.current)
      } catch {
        // Ignore
      }

      queryClient.invalidateQueries({ queryKey: ["post", postId] })
      toast.success(
        status === "DRAFT"
          ? "Draft saved"
          : status === "PENDING_REVIEW"
          ? "Submitted for review"
          : status === "SCHEDULED"
          ? "Post scheduled"
          : "Post updated"
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save post")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReview = async (action: "approve" | "reject") => {
    if (!isOnline) {
      toast.error("Cannot review posts while offline")
      return
    }
    try {
      const res = await fetch(`/api/posts/${postId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "reject" ? rejectionReason : undefined,
        }),
      })
      if (!res.ok) throw new Error("Failed to review post")
      queryClient.invalidateQueries({ queryKey: ["post", postId] })
      toast.success(action === "approve" ? "Post approved" : "Post rejected")
    } catch {
      toast.error("Failed to review post")
    }
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const createTag = async () => {
    if (!tagInput.trim()) return
    if (!isOnline) {
      toast.error("Cannot create tags while offline")
      return
    }
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagInput.trim() }),
      })
      if (!res.ok) throw new Error("Failed to create tag")
      const newTag = await res.json()
      setSelectedTags((prev) => [...prev, newTag.id])
      setTagInput("")
      toast.success("Tag created")
    } catch {
      toast.error("Failed to create tag")
    }
  }

  if (postLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        label: string
        variant: "default" | "secondary" | "destructive" | "outline"
      }
    > = {
      PUBLISHED: { label: "Published", variant: "default" },
      DRAFT: { label: "Draft", variant: "secondary" },
      PENDING_REVIEW: { label: "Pending Review", variant: "outline" },
      APPROVED: { label: "Approved", variant: "default" },
      SCHEDULED: { label: "Scheduled", variant: "outline" },
      REJECTED: { label: "Rejected", variant: "destructive" },
      ARCHIVED: { label: "Archived", variant: "secondary" },
    }
    const info = variants[status] || {
      label: status,
      variant: "secondary" as const,
    }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Draft Recovery Banner */}
      {showRecoveryBanner && draftRecovery && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <RotateCcw className="size-4 shrink-0" />
                <p className="text-sm">
                  You have an unsaved draft from{" "}
                  <span className="font-medium">
                    {new Date(draftRecovery.updatedAt).toLocaleString()}
                  </span>
                  . Resume editing?
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={restoreDraft} variant="default">
                  Resume
                </Button>
                <Button
                  size="sm"
                  onClick={discardDraft}
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                >
                  Discard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/posts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Edit Post</h1>
              {post && getStatusBadge(post.status)}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-muted-foreground">
                by {post?.author.name}
              </p>
              <SaveStatusIndicator
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowRevisions(true)}
            className="gap-2"
          >
            <History className="size-4" />
            Revisions
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave("DRAFT")}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : !isOnline ? (
              <CloudOff className="mr-2 size-4" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {!isOnline ? "Save Offline" : "Save Draft"}
          </Button>
          <Button
            onClick={() => handleSave("PENDING_REVIEW")}
            disabled={isSaving || !isOnline}
            title={!isOnline ? "Cannot submit while offline" : undefined}
          >
            {isSaving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Submit for Review
          </Button>
          {canReview && (
            <>
              <Button
                variant="outline"
                className="gap-2 text-emerald-600 hover:text-emerald-700"
                onClick={() => handleReview("approve")}
                disabled={!isOnline}
              >
                <CheckCircle2 className="size-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  if (!isOnline) {
                    toast.error("Cannot reject posts while offline")
                    return
                  }
                  const reason = window.prompt("Reason for rejection:")
                  if (reason) {
                    setRejectionReason(reason)
                    handleReview("reject")
                  }
                }}
                disabled={!isOnline}
              >
                <XCircle className="size-4" />
                Reject
              </Button>
            </>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!isOnline}
              >
                <Calendar className="size-4" />
                Schedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={scheduledAt}
                onSelect={setScheduledAt}
                disabled={(date) => date < new Date()}
              />
              {scheduledAt && (
                <div className="p-3 border-t">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleSave("SCHEDULED")}
                    disabled={isSaving || !isOnline}
                  >
                    Schedule for {format(scheduledAt, "PPP")}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {post?.rejectedReason && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">
              Rejection Reason:
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {post.rejectedReason}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter post title..."
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-friendly-slug"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your story..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredImage ? (
                <div className="relative group">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity size-7"
                    onClick={() => setFeaturedImage("")}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <ImageIcon className="size-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {isOnline ? "Click to upload" : "Online required to upload"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={!isOnline}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={
                      selectedCategories.includes(cat.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="New tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), createTag())
                  }
                  disabled={!isOnline}
                />
                <Button
                  size="sm"
                  onClick={createTag}
                  disabled={!tagInput.trim() || !isOnline}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      selectedTags.includes(tag.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Custom SEO title"
                />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revisions Dialog */}
      <Dialog open={showRevisions} onOpenChange={setShowRevisions}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revision History</DialogTitle>
          </DialogHeader>
          {revisions && revisions.length > 0 ? (
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div key={rev.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      Version {rev.version}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(rev.createdAt), "PPP p")}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{rev.title}</p>
                  {rev.changeNote && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {rev.changeNote}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    by {rev.author.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No revisions yet
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRevisions(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
