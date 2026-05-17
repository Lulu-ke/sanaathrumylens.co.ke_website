'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search as SearchIcon, FileText, Calendar, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PostCard } from '@/components/blog/post-card';
import { EventCard } from '@/components/blog/event-card';
import { Button } from '@/components/ui/button';

type FilterType = 'all' | 'posts' | 'events';

export function SearchPageClient() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [posts, setPosts] = useState<Parameters<typeof PostCard>[0]['post'][]>([]);
  const [events, setEvents] = useState<Parameters<typeof EventCard>[0]['event'][]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) return;

    setLoading(true);
    try {
      const [postsRes, eventsRes] = await Promise.all([
        fetch(`/api/posts?search=${encodeURIComponent(q)}&limit=20`),
        fetch(`/api/events?search=${encodeURIComponent(q)}&limit=20`),
      ]);

      const postsData = postsRes.ok ? await postsRes.json() : { posts: [] };
      const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };

      setPosts(postsData.posts || []);
      setEvents(eventsData.events || []);
      setSearched(true);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        search(query);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, search]);

  const filteredPosts = filter === 'events' ? [] : posts;
  const filteredEvents = filter === 'posts' ? [] : events;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto mb-10">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-center mb-6">
          Search Sanaa
        </h1>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stories, events, authors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 h-12 text-lg"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Filter tabs */}
        {searched && (
          <div className="flex gap-1 mt-4 justify-center">
            {(['all', 'posts', 'events'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-full capitalize transition-all ${
                  filter === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {tab === 'all' && ` (${posts.length + events.length})`}
                {tab === 'posts' && ` (${posts.length})`}
                {tab === 'events' && ` (${events.length})`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {searched && !loading && (
        <div>
          {/* Posts Results */}
          {filteredPosts.length > 0 && (
            <section className="mb-10">
              <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Stories ({filteredPosts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* Events Results */}
          {filteredEvents.length > 0 && (
            <section className="mb-10">
              <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Events ({filteredEvents.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {filteredPosts.length === 0 && filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-muted-foreground mt-1">
                Try different keywords or browse our categories
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setQuery('')}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Initial state */}
      {!searched && !loading && (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-lg text-muted-foreground">
            Type to search for stories, events, and more
          </p>
        </div>
      )}
    </div>
  );
}
