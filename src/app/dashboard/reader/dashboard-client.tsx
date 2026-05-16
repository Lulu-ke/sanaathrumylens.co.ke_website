'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark, MessageCircle, Settings, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface ReaderDashboardClientProps {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  bookmarks: {
    id: string;
    createdAt: string;
    post: {
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      featuredImage: string | null;
      publishedAt: string | null;
      readingTime: number;
      author: { id: string; name: string; username: string; image: string | null };
      categories: { category: { id: string; name: string; slug: string; color: string | null } }[];
    };
  }[];
  comments: {
    id: string;
    content: string;
    status: string;
    createdAt: string;
    post: { id: string; title: string; slug: string };
  }[];
}

export function ReaderDashboardClient({ user, bookmarks, comments }: ReaderDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'comments' | 'settings'>('bookmarks');
  const [bookmarkList, setBookmarkList] = useState(bookmarks);

  const handleRemoveBookmark = async (postId: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setBookmarkList((prev) => prev.filter((b) => b.post.id !== postId));
        toast.success('Bookmark removed');
      }
    } catch {
      toast.error('Failed to remove bookmark');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* User Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-serif text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {([
          { key: 'bookmarks' as const, label: 'Bookmarks', icon: Bookmark },
          { key: 'comments' as const, label: 'Comments', icon: MessageCircle },
          { key: 'settings' as const, label: 'Settings', icon: Settings },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold">Your Bookmarks ({bookmarkList.length})</h2>
          {bookmarkList.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No bookmarks yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Save stories to read later by clicking the bookmark icon
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4">Browse Stories</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarkList.map((bookmark) => {
                const post = bookmark.post;
                const primaryCategory = post.categories[0]?.category;
                return (
                  <div
                    key={bookmark.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt=""
                        className="w-20 h-14 object-cover rounded-md shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/post/${post.slug}`} className="group">
                        <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {primaryCategory && (
                          <Badge
                            className="text-[10px] h-4"
                            style={{
                              backgroundColor: primaryCategory.color || undefined,
                              color: '#fff',
                              border: 'none',
                            }}
                          >
                            {primaryCategory.name}
                          </Badge>
                        )}
                        <span>{post.readingTime} min read</span>
                        <span>·</span>
                        <span>{post.author.name}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveBookmark(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold">Your Comments ({comments.length})</h2>
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Join the conversation on our stories
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4">Browse Stories</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/post/${comment.post.slug}`}
                      className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {comment.post.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Badge
                      variant={comment.status === 'APPROVED' ? 'default' : 'outline'}
                      className="text-[10px]"
                    >
                      {comment.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(comment.createdAt).toLocaleDateString('en-KE', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Profile settings and newsletter preferences coming soon.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
