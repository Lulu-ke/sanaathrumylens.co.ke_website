'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

interface ReadingList {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
  items: { post: { id: string; featuredImage: string | null } }[];
  _count: { items: number };
}

interface Bookmark {
  id: string;
  post: {
    id: string;
    title: string;
    slug: string;
    featuredImage: string | null;
    publishedAt: string | null;
    readingTime: number;
    author: { id: string; name: string; username: string; image: string | null };
    categories: { category: { id: string; name: string; slug: string; color: string | null } }[];
  };
}

interface ReadingListsClientProps {
  initialLists: ReadingList[];
  bookmarks: Bookmark[];
}

export function ReadingListsClient({ initialLists, bookmarks }: ReadingListsClientProps) {
  const [lists, setLists] = useState(initialLists);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const res = await fetch('/api/reading-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      if (res.ok) {
        const newList = await res.json();
        setLists((prev) => [newList, ...prev]);
        setNewListName('');
        setShowNewList(false);
      }
    } catch {
      // Silently fail
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const res = await fetch(`/api/reading-lists/${listId}`, { method: 'DELETE' });
      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== listId));
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Reading Lists
          </h1>
          <p className="text-muted-foreground mt-1">Organize your saved stories into lists</p>
        </div>
        <Button onClick={() => setShowNewList(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New List
        </Button>
      </div>

      {showNewList && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              />
              <Button onClick={handleCreateList} size="sm">Create</Button>
              <Button variant="outline" size="sm" onClick={() => { setShowNewList(false); setNewListName(''); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium">No reading lists yet</p>
          <p className="text-muted-foreground mt-1">Create your first list to organize saved stories</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list) => (
            <Card key={list.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteList(list.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {list.description && (
                  <p className="text-sm text-muted-foreground">{list.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {list._count.items} {list._count.items === 1 ? 'story' : 'stories'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {bookmarks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Bookmarked Stories ({bookmarks.length})</h2>
          <p className="text-sm text-muted-foreground">
            Add these to a reading list from the story page
          </p>
        </div>
      )}
    </div>
  );
}
