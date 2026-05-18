"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  FileText,
  MessageSquare,
  Calendar,
  Users,
  Eye,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  pendingPosts: number
  draftPosts: number
  totalComments: number
  pendingComments: number
  totalEvents: number
  upcomingEvents: number
  totalUsers: number
  totalViews: number
  recentPosts: { id: string; title: string; status: string; createdAt: string; author: { name: string } }[]
  recentComments: { id: string; content: string; createdAt: string; author: { name: string }; post: { title: string } }[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const role = (session?.user?.role as string) || "AUTHOR"

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  const statCards = () => {
    // Moderator-specific stats
    if (role === "MODERATOR") {
      return [
        {
          title: "Pending Comments",
          value: stats?.pendingComments || 0,
          icon: MessageSquare,
          description: "Awaiting review",
          href: "/dashboard/comments?status=PENDING",
          color: "text-violet-600",
          bgColor: "bg-violet-50 dark:bg-violet-950/30",
        },
        {
          title: "Total Comments",
          value: stats?.totalComments || 0,
          icon: CheckCircle2,
          description: "All comments",
          href: "/dashboard/comments",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        },
        {
          title: "Published Posts",
          value: stats?.publishedPosts || 0,
          icon: FileText,
          description: "Active content",
          href: "/dashboard/moderation",
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
        },
        {
          title: "Flagged Content",
          value: 0,
          icon: Clock,
          description: "Needs attention",
          href: "/dashboard/flagged",
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-950/30",
        },
      ]
    }

    const cards = [
      {
        title: "Total Posts",
        value: stats?.totalPosts || 0,
        icon: FileText,
        description: `${stats?.publishedPosts || 0} published`,
        href: "/dashboard/posts",
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
      },
      {
        title: "Pending Reviews",
        value: stats?.pendingPosts || 0,
        icon: Clock,
        description: "Awaiting review",
        href: "/dashboard/posts",
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
      },
      {
        title: "Comments",
        value: stats?.totalComments || 0,
        icon: MessageSquare,
        description: `${stats?.pendingComments || 0} pending`,
        href: "/dashboard/comments",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      },
      {
        title: "Events",
        value: stats?.totalEvents || 0,
        icon: Calendar,
        description: `${stats?.upcomingEvents || 0} upcoming`,
        href: "/dashboard/events",
        color: "text-rose-600",
        bgColor: "bg-rose-50 dark:bg-rose-950/30",
      },
    ]

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      cards.push({
        title: "Users",
        value: stats?.totalUsers || 0,
        icon: Users,
        description: "Registered users",
        href: "/dashboard/users",
        color: "text-violet-600",
        bgColor: "bg-violet-50 dark:bg-violet-950/30",
      })
    }

    return cards
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PUBLISHED: { label: "Published", variant: "default" },
      DRAFT: { label: "Draft", variant: "secondary" },
      PENDING_REVIEW: { label: "Pending", variant: "outline" },
      APPROVED: { label: "Approved", variant: "default" },
      SCHEDULED: { label: "Scheduled", variant: "outline" },
      REJECTED: { label: "Rejected", variant: "destructive" },
      ARCHIVED: { label: "Archived", variant: "secondary" },
    }
    const info = variants[status] || { label: status, variant: "secondary" as const }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || "User"}
          </p>
        </div>
        {(role === "SUPER_ADMIN" || role === "ADMIN" || role === "EDITOR" || role === "AUTHOR") && (
          <div className="flex gap-2">
            <Link href="/dashboard/posts/new">
              <Button className="gap-2">
                <Plus className="size-4" />
                New Post
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: statCards().length }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-8 w-20 mt-3" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </CardContent>
              </Card>
            ))
          : statCards().map((card) => (
              <Link key={card.title} href={card.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`${card.bgColor} p-2 rounded-lg`}>
                        <card.icon className={`size-5 ${card.color}`} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Actions */}
      {(role === "EDITOR" || role === "SUPER_ADMIN" || role === "ADMIN") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/posts?status=PENDING_REVIEW">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="size-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Review Pending Posts</p>
                  <p className="text-xs text-muted-foreground">{stats?.pendingPosts || 0} posts awaiting review</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/comments?status=PENDING">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-sm">Moderate Comments</p>
                  <p className="text-xs text-muted-foreground">{stats?.pendingComments || 0} comments pending</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/posts/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
              <CardContent className="p-4 flex items-center gap-3">
                <Plus className="size-5 text-orange-500" />
                <div>
                  <p className="font-medium text-sm">Create New Content</p>
                  <p className="text-xs text-muted-foreground">Write a post or create an event</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Moderator Quick Actions */}
      {role === "MODERATOR" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/comments?status=PENDING">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-violet-500">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="size-5 text-violet-500" />
                <div>
                  <p className="font-medium text-sm">Review Pending Comments</p>
                  <p className="text-xs text-muted-foreground">{stats?.pendingComments || 0} comments awaiting moderation</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/flagged">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="size-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Flagged Content</p>
                  <p className="text-xs text-muted-foreground">Review content reported by the community</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/comments">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-sm">All Comments</p>
                  <p className="text-xs text-muted-foreground">{stats?.totalComments || 0} total comments</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Posts</CardTitle>
            <CardDescription>Latest published and draft posts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : stats?.recentPosts && stats.recentPosts.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {stats.recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="flex items-center justify-between py-2 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(post.status)}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No posts yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Comments</CardTitle>
            <CardDescription>Latest reader comments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : stats?.recentComments && stats.recentComments.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {stats.recentComments.map((comment) => (
                  <div key={comment.id} className="py-2 border-b last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        on {comment.post.title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {comment.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
