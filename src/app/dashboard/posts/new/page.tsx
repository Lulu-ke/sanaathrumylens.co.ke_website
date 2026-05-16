"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import {
  Save,
  Send,
  Calendar,
  ArrowLeft,
  Loader2,
  ImageIcon,
  X,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/media", { method: "POST", body: formData })
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
            <p className="text-muted-foreground">Create a new blog post</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => handleSave("DRAFT")}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave("PENDING_REVIEW")}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Submit for Review
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
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
                    disabled={isSaving}
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
                <Label htmlFor="title" className="text-base font-semibold">Title</Label>
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
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
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
                    variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
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
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createTag())}
                />
                <Button size="sm" onClick={createTag} disabled={!tagInput.trim()}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
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
