"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import {
  Save,
  Send,
  Calendar,
  ArrowLeft,
  Loader2,
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { SaveStatusIndicator } from "@/components/editor/save-status-indicator"
import { OfflineBanner } from "@/components/editor/offline-banner"
import { ImageUpload } from "@/components/dashboard/image-upload"
import { useAutoSave } from "@/hooks/use-auto-save"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { getDraft, deleteDraft, type OfflineDraft } from "@/lib/offline-db"
import { toast } from "sonner"
import { format } from "date-fns"

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

export default function NewPostPage() {
  const router = useRouter()
  const { data: session } = useSession()
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

  // Draft recovery state
  const [draftRecovery, setDraftRecovery] = useState<OfflineDraft | null>(null)
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)

  // Generate a stable draft ID for this editing session
  const draftIdRef = useRef(`new-post-${crypto.randomUUID()}`)

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
  const {
    saveStatus,
    lastSavedAt,
    hasUnsavedChanges,
    saveNow,
    draftData,
  } = useAutoSave({
    draftId: draftIdRef.current,
    entityType: "post",
    data: formData,
    interval: 30000,
    debounceMs: 2000,
    serverSaveUrl: "/api/posts",
    serverSaveMethod: "POST",
    enabled: true,
  })

  // Check for existing draft on mount
  useEffect(() => {
    async function checkForDraft() {
      try {
        const draft = await getDraft(draftIdRef.current)
        if (draft && draft.data && Object.keys(draft.data).length > 0) {
          // Check if draft has meaningful content
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
  }, [])

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

  useEffect(() => {
    if (title && !slug) {
      setSlug(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      )
    }
  }, [title, slug])

  const handleImageUpload = (url: string) => {
    setFeaturedImage(url)
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
        featuredImage,
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

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save post")
      }

      const post = await res.json()

      // Clean up local draft after successful save
      try {
        await deleteDraft(draftIdRef.current)
      } catch {
        // Ignore
      }

      toast.success(
        status === "DRAFT"
          ? "Draft saved"
          : status === "PENDING_REVIEW"
          ? "Submitted for review"
          : status === "SCHEDULED"
          ? "Post scheduled"
          : "Post saved"
      )
      router.push(`/dashboard/posts/${post.id}/edit`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save post")
    } finally {
      setIsSaving(false)
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
            <h1 className="text-2xl font-bold tracking-tight">New Post</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-muted-foreground">Create a new blog post</p>
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
                  placeholder="Brief description of the post..."
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
          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={featuredImage}
                onChange={handleImageUpload}
                folder="posts"
                hint="Click to upload featured image"
                aspectClass="aspect-video h-40"
                disabled={!isOnline}
                altText="Featured image"
              />
            </CardContent>
          </Card>

          {/* Categories */}
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

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="New tag name"
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

          {/* SEO */}
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
                  placeholder="Custom title for search engines"
                />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Meta description for search engines"
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
    </div>
  )
}
