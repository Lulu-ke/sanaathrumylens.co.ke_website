'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search as SearchIcon,
  FileText,
  Calendar,
  Loader2,
  SlidersHorizontal,
  X,
  ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PostCard } from '@/components/blog/post-card';
import { EventCard } from '@/components/blog/event-card';

type FilterType = 'all' | 'posts' | 'events';
type SortOption = 'newest' | 'oldest' | 'most-viewed' | 'most-bookmarked';

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count?: { posts: number; events: number };
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

const SORT_MAP: Record<SortOption, { sortBy: string; sortOrder: string }> = {
  newest: { sortBy: 'publishedAt', sortOrder: 'desc' },
  oldest: { sortBy: 'publishedAt', sortOrder: 'asc' },
  'most-viewed': { sortBy: 'viewCount', sortOrder: 'desc' },
  'most-bookmarked': { sortBy: 'bookmarkCount', sortOrder: 'desc' },
};

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial state from URL
  const initialQuery = searchParams.get('q') || '';
  const initialType = (searchParams.get('type') as FilterType) || 'all';
  const initialCategory = searchParams.get('category') || '';
  const initialTag = searchParams.get('tag') || '';
  const initialDateFrom = searchParams.get('dateFrom') || '';
  const initialDateTo = searchParams.get('dateTo') || '';
  const initialSort = (searchParams.get('sort') as SortOption) || 'newest';

  // State
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterType>(initialType);
  const [categoryId, setCategoryId] = useState(initialCategory);
  const [tagId, setTagId] = useState(initialTag);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Data
  const [posts, setPosts] = useState<Parameters<typeof PostCard>[0]['post'][]>([]);
  const [events, setEvents] = useState<Parameters<typeof EventCard>[0]['event'][]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Refs for latest state (avoids stale closures in effects)
  const stateRef = useRef({ query, categoryId, tagId, dateFrom, dateTo, sort });
  stateRef.current = { query, categoryId, tagId, dateFrom, dateTo, sort };

  // Track if initial search has been done
  const initialSearchDone = useRef(false);

  // Sync URL params
  const syncURL = useCallback(() => {
    const params = new URLSearchParams();
    const { query: q, categoryId: cat, tagId: tag, dateFrom: df, dateTo: dt, sort: s } = stateRef.current;
    if (q) params.set('q', q);
    if (filter && filter !== 'all') params.set('type', filter);
    if (cat) params.set('category', cat);
    if (tag) params.set('tag', tag);
    if (df) params.set('dateFrom', df);
    if (dt) params.set('dateTo', dt);
    if (s && s !== 'newest') params.set('sort', s);

    const search = params.toString();
    router.replace(`/search${search ? `?${search}` : ''}`, { scroll: false });
  }, [filter, router]);

  // Fetch categories and tags on mount
  useEffect(() => {
    async function fetchFilters() {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/categories?limit=50'),
          fetch('/api/tags?limit=20'),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : []);
        }
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          setTags(Array.isArray(tagData) ? tagData : []);
        }
      } catch {
        // Silently fail
      }
    }
    fetchFilters();
  }, []);

  // Core search function
  const doSearch = useCallback(async () => {
    const { query: q, categoryId: cat, tagId: tag, dateFrom: df, dateTo: dt, sort: s } = stateRef.current;
    setLoading(true);
    try {
      const sortConfig = SORT_MAP[s];
      const postsParams = new URLSearchParams();
      const eventsParams = new URLSearchParams();

      if (q.trim() && q.length >= 2) {
        postsParams.set('search', q.trim());
        eventsParams.set('search', q.trim());
      }
      if (cat) {
        postsParams.set('categoryId', cat);
        eventsParams.set('categoryId', cat);
      }
      if (tag) {
        postsParams.set('tagId', tag);
      }
      if (df) {
        postsParams.set('dateFrom', df);
      }
      if (dt) {
        postsParams.set('dateTo', dt);
      }
      postsParams.set('sortBy', sortConfig.sortBy);
      postsParams.set('sortOrder', sortConfig.sortOrder);
      postsParams.set('limit', '20');
      eventsParams.set('limit', '20');

      const [postsRes, eventsRes] = await Promise.all([
        fetch(`/api/posts?${postsParams.toString()}`),
        fetch(`/api/events?${eventsParams.toString()}`),
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

  // Debounced search on query change
  useEffect(() => {
    if (initialSearchDone.current) {
      const timer = setTimeout(() => {
        if (query.length >= 2 || query.length === 0) {
          doSearch();
          syncURL();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [query, doSearch, syncURL]);

  // Search when filters change
  useEffect(() => {
    if (initialSearchDone.current) {
      doSearch();
      syncURL();
    }
  }, [categoryId, tagId, dateFrom, dateTo, sort, filter, doSearch, syncURL]);

  // Initial search from URL params
  useEffect(() => {
    if (initialQuery || initialCategory || initialTag || initialDateFrom || initialDateTo) {
      doSearch();
      if (initialCategory || initialTag || initialDateFrom || initialDateTo) {
        setFiltersOpen(true);
      }
    }
    initialSearchDone.current = true;
  }, []);

  const handleCategoryChange = (value: string) => {
    setCategoryId(value === '__all__' ? '' : value);
  };

  const handleSortChange = (value: string) => {
    setSort(value as SortOption);
  };

  const handleTagToggle = (id: string) => {
    setTagId((prev) => (prev === id ? '' : id));
  };

  const clearFilters = () => {
    setCategoryId('');
    setTagId('');
    setDateFrom('');
    setDateTo('');
    setSort('newest');
    setFilter('all');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryId) count++;
    if (tagId) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (sort !== 'newest') count++;
    if (filter !== 'all') count++;
    return count;
  }, [categoryId, tagId, dateFrom, dateTo, sort, filter]);

  const filteredPosts = filter === 'events' ? [] : posts;
  const filteredEvents = filter === 'posts' ? [] : events;

  const selectedCategoryName = useMemo(
    () => (categoryId ? categories.find((c) => c.id === categoryId)?.name : null),
    [categoryId, categories]
  );

  const selectedTagName = useMemo(
    () => (tagId ? tags.find((t) => t.id === tagId)?.name : null),
    [tagId, tags]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto mb-6">
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

        {/* Filter toggle + type tabs */}
        <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
          {/* Filter tabs */}
          <div className="flex gap-1">
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
                {tab === 'all' && searched && ` (${posts.length + events.length})`}
                {tab === 'posts' && searched && ` (${posts.length})`}
                {tab === 'events' && searched && ` (${events.length})`}
              </button>
            ))}
          </div>

          {/* Filter toggle button */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="w-auto">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* Filter Panel */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <div className="max-w-4xl mx-auto mb-8 rounded-lg border bg-card p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category-filter">Category</Label>
                <Select value={categoryId || '__all__'} onValueChange={handleCategoryChange}>
                  <SelectTrigger id="category-filter" className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                        {cat._count && ` (${cat._count.posts + cat._count.events})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sort-filter">Sort By</Label>
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger id="sort-filter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="most-viewed">Most Viewed</SelectItem>
                    <SelectItem value="most-bookmarked">Most Bookmarked</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label htmlFor="date-from">Date From</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label htmlFor="date-to">Date To</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-5">
                <Label className="mb-2 block">Popular Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={tagId === tag.id ? 'default' : 'outline'}
                      className="cursor-pointer select-none transition-colors hover:bg-primary/10 text-sm py-1 px-3"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.name}
                      {tag._count && tag._count.posts > 0 && (
                        <span className="ml-1 text-[10px] opacity-60">({tag._count.posts})</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Active filter indicators + Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="mt-4 flex items-center justify-between border-t pt-4 gap-2">
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  {selectedCategoryName && (
                    <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                      {selectedCategoryName}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setCategoryId('')}
                      />
                    </Badge>
                  )}
                  {selectedTagName && (
                    <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                      {selectedTagName}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setTagId('')}
                      />
                    </Badge>
                  )}
                  {dateFrom && (
                    <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                      From: {dateFrom}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setDateFrom('')}
                      />
                    </Badge>
                  )}
                  {dateTo && (
                    <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                      To: {dateTo}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setDateTo('')}
                      />
                    </Badge>
                  )}
                  {sort !== 'newest' && (
                    <Badge variant="secondary" className="gap-1 text-xs shrink-0">
                      {sort === 'oldest' && 'Oldest First'}
                      {sort === 'most-viewed' && 'Most Viewed'}
                      {sort === 'most-bookmarked' && 'Most Bookmarked'}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => setSort('newest')}
                      />
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 shrink-0">
                  <X className="h-3 w-3" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results count indicators */}
      {searched && !loading && (
        <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
          {filteredPosts.length > 0 && (
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              <strong className="text-foreground">{filteredPosts.length}</strong>{' '}
              {filteredPosts.length === 1 ? 'story' : 'stories'} found
            </span>
          )}
          {filteredEvents.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <strong className="text-foreground">{filteredEvents.length}</strong>{' '}
              {filteredEvents.length === 1 ? 'event' : 'events'} found
            </span>
          )}
        </div>
      )}

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
                Try different keywords or adjust your filters
              </p>
              {activeFilterCount > 0 ? (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button variant="outline" className="mt-4" onClick={() => setQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Searching...</p>
        </div>
      )}

      {/* Initial state */}
      {!searched && !loading && (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-lg text-muted-foreground">
            Type to search for stories, events, and more
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Use filters to narrow down results by category, date, or tags
          </p>
        </div>
      )}
    </div>
  );
}
