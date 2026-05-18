# Work Log — Task 1-2: Dashboard Login Lock + Community Voice

## Feature 1: Lock Dashboard Login to ADMIN+ Only

### 1A. Sign-in form (`src/app/auth/signin/components/signin-form.tsx`)
- Added subdomain detection via `window.location.hostname` matching known subdomains (control, admin, editor, author, moderator)
- **On subdomain**:
  - Google OAuth button hidden
  - "Don't have an account? Sign Up" link hidden
  - Staff-only notice displayed: "Staff login — use your dashboard credentials"
  - Shield icon shown instead of Camera icon
  - After successful login, checks user role — READERS are rejected with error "This login is for staff only. Readers sign in on the main site."
  - Callback URL redirects to subdomain dashboard
- **On base domain**:
  - Both email/password and Google OAuth shown
  - "Sign Up" link shown
  - After successful login, ADMIN+ users (MODERATOR+) are auto-redirected to their subdomain dashboard
  - READER users stay on base domain dashboard

### 1D. Middleware (`src/middleware.ts`)
- Added `/api/community` to `apiRoleRequirements` with "READER" requirement
- Added block for `/auth/signup` on subdomains — redirects to base domain signup page with X-Debug header

## Feature 2: Community Voice — Reader Submissions

### 2A. Prisma Schema (`prisma/schema.prisma`)
- Added `isCommunityVoice Boolean @default(false)` to Post model
- Ran `prisma generate` and `db:push` successfully

### 2B. Community Submission API (`src/app/api/community/submit/route.ts`)
- POST endpoint for authenticated READER users only
- Zod validation: title (5-200 chars), content (min 100 chars), categoryIds (array, min 1), tagIds (optional array)
- Creates Post with `status: "PENDING_REVIEW"`, `isCommunityVoice: true`
- Auto-generates slug from title using `generateUniqueSlug`
- Calculates reading time from content
- Staff members (MODERATOR+) are rejected with "Staff members should use the dashboard editor"
- Notifies EDITOR+ users about new submissions via `notifyUsersByRole`

### 2C. Public Submission Page (`src/app/(blog)/community/`)
- **page.tsx**: Server component with metadata for SEO
- **community-client.tsx**: Client component with:
  - Hero section: "Share Your Voice" with emerald/emerald icon
  - Three requirement cards: Minimum 100 Words, Original Content, Editorial Review
  - Auth-dependent rendering:
    - Not logged in → "Sign in to submit your story" with Sign In / Create Account buttons
    - Staff (MODERATOR+) → "Staff members use the dashboard editor" with dashboard link
    - READER → Full submission form with title input, content textarea (with word count), category selector (toggle buttons), optional tag selector, submit button
  - Success state: "Thank You! Your submission is under review."
  - Community Voice info badge at bottom

### 2D. Community Voice Badge on Post Detail Page
- **post-detail-client.tsx**: Added `isCommunityVoice` to PostDetailClientProps interface; shows emerald-colored "Community Voice" badge next to category badge (before Sponsored badge)
- **page.tsx**: Changed from `include` to explicit `select` to include `isCommunityVoice` field in query

### 2E. Dashboard Posts Indicator
- **src/app/dashboard/posts/page.tsx**: Added `isCommunityVoice` to Post interface; shows small emerald "Community" badge next to post title when `isCommunityVoice` is true

### 2F. Community Navigation Link
- **src/components/layout/header.tsx**: Added `{ href: '/community', label: 'Community' }` to navLinks array, visible in both desktop and mobile navigation

## Build Verification
- `npx prisma generate` — successful
- `bun run db:push` — database in sync
- `npx next build` — compiled successfully with `/community` route listed

---

# Work Log — Task 3: Related Posts Algorithm Improvement

## Summary
Replaced the simple category-only related posts algorithm with a smarter tag-matching + recency-weighting scoring system.

## File Changed
- `src/app/(blog)/post/[slug]/page.tsx` (lines 90-137)

## What Changed

### Before
- Related posts fetched only by shared categories (`categories: { some: { categoryId: { in: categoryIds } } }`)
- Simple `orderBy: { publishedAt: 'desc' }` with `take: 3`
- No tag matching, no relevance scoring, no recency weighting

### After
- **Candidate fetching**: Posts that share at least 1 category OR 1 tag (using Prisma `OR` filter)
- **Scoring algorithm** applied in-memory to up to 30 candidates:
  - **+3 points** per shared category (strongest signal)
  - **+2 points** per shared tag (moderate signal)
  - **+1 point** if published within last 30 days (recency bonus)
  - **+1 point** if featured (editorial priority)
- **Sorting**: Primary sort by score descending, secondary sort by `publishedAt` descending (breaks ties)
- **Result**: Top 6 related posts returned (up from 3)

### Implementation Details
- Used `Set` for O(1) category/tag ID lookups during scoring
- Two-step approach: Prisma fetches candidates → JS scores and sorts (since Prisma doesn't support computed scoring)
- Fetched 30 candidates to have a good pool before scoring; trimmed to top 6
- Author posts section left unchanged (separate from related posts)
- `_score` field added to objects but is harmless extra data passed through `JSON.parse(JSON.stringify())`

## Verification
- `bun run lint` — no new errors (pre-existing errors in unrelated files)
- Dev server running and serving pages correctly
- Data shape matches `PostCard` component expectations (all required fields present from `include` query)

---

# Work Log — Task 4: Server-side Push Notifications

## Summary
Implemented server-side push notification system using the `web-push` npm package, integrated into existing post review, comment reply, and community voice submission workflows.

## Files Created

### 1. `src/lib/web-push-server.ts` — Server-side push utility
- Configures `web-push` with VAPID keys from environment variables
- `sendPushToUser(userId, payload)`: Sends push notification to a specific user by looking up their PushSubscription records from DB
- `sendPushToRole(minRole, payload)`: Sends push notification to all active users with a minimum role level
- `PushPayload` interface: title, body, icon, badge, url, type
- Handles expired subscriptions (410/404 status codes) by removing them from DB
- Gracefully skips push when VAPID keys are not configured

### 2. `src/app/api/push/send/route.ts` — Send Push API endpoint
- POST endpoint requiring ADMIN+ role
- Accepts either `userId` (specific user) or `minRole` (role-based broadcast)
- Zod validation for title, body, url, type, icon, badge fields
- Returns `{ sent, failed }` counts

## Files Modified

### 3. `src/app/api/posts/[id]/review/route.ts` — Post review workflow
- **Post submitted for review** (POST handler): Added `sendPushToRole("EDITOR", ...)` to notify editors via push when a post changes to PENDING_REVIEW
- **Post approved** (PATCH handler, action=approve): Added `sendPushToUser(post.authorId, ...)` with type `post_approved`
- **Post rejected** (PATCH handler, action=reject): Added `sendPushToUser(post.authorId, ...)` with type `post_rejected`

### 4. `src/app/api/comments/route.ts` — Comment reply workflow
- Added `sendPushToUser(parentComment.authorId, ...)` when a reply is created (parentId present)
- Only sends push if the reply author is different from the parent comment author
- Type: `comment_reply`

### 5. `src/app/api/community/submit/route.ts` — Community voice workflow
- Added `sendPushToRole("EDITOR", ...)` with type `new_post` when a community voice submission is created

### 6. `public/sw.js` — Service worker updates
- **Push event handler**: Updated to parse `url` and `type` fields from server payload (was only parsing `link` before)
- Added `type` field to notification data for type-based icon mapping
- Added unique `tag` per notification to prevent notification stacking issues
- Added `requireInteraction: true` for `post_rejected` type so important notifications stay visible
- **Notification click handler**: Added `notificationType` extraction from notification data for future use; improved comments

## Package Installed
- `web-push` (installed via `npm install web-push --legacy-peer-deps`)

## Verification
- `bun run lint` — no new errors (all lint errors are pre-existing in unrelated files)
- Dev server running and serving pages correctly

---

# Work Log — Task: Advanced Search Filters

## Summary
Implemented advanced search filters in the search UI with collapsible filter panel, URL state sync, date range filtering, category/tag/sort filters, and results count indicators.

## Files Modified

### 1. `src/app/api/posts/route.ts` — Posts API date range support
- Added `dateFrom` and `dateTo` query parameter parsing
- Added Prisma `where.publishedAt` filtering:
  - `dateFrom` → `publishedAt.gte = new Date(dateFrom)`
  - `dateTo` → `publishedAt.lte = new Date(dateTo + 'T23:59:59')`
- Works correctly alongside existing `where.OR` (search) and other filters since Prisma ANDs top-level keys

### 2. `src/app/(blog)/search/search-client.tsx` — Complete rewrite
- **Filter Panel** (collapsible via `Collapsible` component):
  - Category dropdown (`<Select>`) fetching from `/api/categories?limit=50` with "All Categories" default
  - Date Range: two `<Input type="date">` fields (From/To) for `publishedAt` filtering
  - Sort By dropdown: "Newest First", "Oldest First", "Most Viewed", "Most Bookmarked"
  - Tags: clickable `Badge` pills (variant="outline") fetched from `/api/tags?limit=20`, single-select toggle
  - Active filter indicators with individual X dismiss buttons
  - "Clear Filters" button to reset all filters
- **URL State Sync**: `useSearchParams` + `useRouter.replace()` to sync all filter state to URL query params (`q`, `type`, `category`, `tag`, `dateFrom`, `dateTo`, `sort`) for shareable/bookmarkable searches
- **API Calls**: Rebuilds fetch URLs with all params:
  - `/api/posts?search=...&categoryId=...&tagId=...&sortBy=...&sortOrder=...&dateFrom=...&dateTo=...&limit=20`
  - `/api/events?search=...&categoryId=...&limit=20`
- **Results Count**: Shows "X stories found" and "Y events found" with icons
- **State Management**: Uses `useRef` for latest state values to avoid stale closure issues in effects; `initialSearchDone` ref prevents double-firing on mount
- **Responsive**: Filter panel stacks vertically on mobile, horizontal grid on desktop (1→2→4 columns)
- **UX**: Debounced query search (500ms), filter panel auto-opens when URL has filter params, loading spinner, empty state with contextual CTA

### 3. `src/app/(blog)/search/page.tsx` — Suspense wrapper
- Wrapped `<SearchPageClient />` in `<Suspense>` boundary (required for `useSearchParams`)

### 4. `src/app/dashboard/reading-lists/reading-lists-client.tsx` — Created placeholder
- Minimal client component to fix pre-existing build error (missing module import)

## Build Verification
- `bun run lint` — no new errors in our files (5 pre-existing errors in unrelated files)
- `npx next build` — compiled successfully

---

# Work Log — Task: Reading Lists / Collections

## Summary
Implemented the ability for users (READER+) to group bookmarks into named reading lists, with support for public/private lists, a shareable public page, and a dashboard management interface.

## Files Modified

### 1. `prisma/schema.prisma` — New models + relation updates
- Added `ReadingList` model: id, name, description, isPublic, slug (unique), userId, items, timestamps
- Added `ReadingListItem` model: id, readingListId, postId, note, timestamps; unique constraint on [readingListId, postId]
- Added `readingLists ReadingList[]` relation to User model
- Added `readingListItems ReadingListItem[]` relation to Post model
- Indexes on userId, slug, isPublic for ReadingList; readingListId, postId for ReadingListItem

### 2. `src/lib/db.ts` — Schema change detection
- Updated model existence check from `artist` to `readingList` for dev hot-reload detection

### 3. `src/lib/auth-helpers.ts` — Slug generation
- Added `"ReadingList"` to the `generateUniqueSlug` model union type

### 4. `src/middleware.ts` — Route protection
- Added `/api/reading-lists` → `"READER"` to `apiRoleRequirements`
- Added `/dashboard/reading-lists` to `allowedReaderPaths` (both base domain and subdomain)

## Files Created

### 5. `src/app/api/reading-lists/route.ts` — List CRUD API
- **GET**: List user's own reading lists with item count + first 3 post covers; supports `?public=true` for all public lists
- **POST**: Create a reading list with name, optional description, optional isPublic flag; auto-generates unique slug; prevents duplicate list names per user

### 6. `src/app/api/reading-lists/[id]/route.ts` — Individual list API
- **GET**: Get single list with paginated items (post data included); private lists only visible to owner (404 for others)
- **PATCH**: Update list name/description/isPublic (owner only); validates no duplicate name
- **DELETE**: Delete list and all items (owner only)

### 7. `src/app/api/reading-lists/[id]/items/route.ts` — List items API
- **POST**: Add post to list with optional note (owner only); checks post exists; prevents duplicate
- **DELETE**: Remove post from list (owner only); takes postId in body

### 8. `src/app/(blog)/list/[slug]/page.tsx` — Public list page (server component)
- Server-side data fetching with `generateMetadata` for SEO
- Returns 404 for non-public or non-existent lists
- Passes serialized data to client component

### 9. `src/app/(blog)/list/[slug]/list-detail-client.tsx` — Public list client component
- Shows list header with name, description, public/private badge, story count
- Author info with avatar and link to author page
- Grid of posts using `PostCard` component with optional note display
- Empty state for lists with no items
- Back to site button

### 10. `src/app/dashboard/reading-lists/page.tsx` — Dashboard page (server component)
- Auth guard + data fetching for user's lists and bookmarks
- Passes serialized data to client component

### 11. `src/app/dashboard/reading-lists/reading-lists-client.tsx` — Dashboard client component
- **Main view**: Grid of reading list cards with name, description, public/private badge, item count, cover thumbnails
- **Create List**: Dialog with name, description, isPublic toggle
- **List detail view**: Click a list to see items with post cards, remove button, add post button
- **Edit List**: Dialog to update name, description, isPublic status
- **Delete List**: With confirmation prompt
- **Add Post**: Dialog listing bookmarked posts to add to a list; shows already-in-list checkmarks
- **Dropdown menu**: Quick actions per list (view public page, add post, delete)
- **Empty states**: For no lists, empty lists, no bookmarks

### 12. Updated `src/components/blog/bookmark-button.tsx` — Save to List dropdown
- When bookmarked: shows bookmark icon + ListPlus dropdown button
- Dropdown fetches user's reading lists lazily on open
- Shows list names with item counts and add-status indicators
- "Create new list" link at bottom when lists exist, "No lists yet" + create link when empty
- Added-to-list checkmarks with emerald Check icon
- Loading spinner when adding to a list
- Not-bookmarked state: unchanged simple bookmark toggle

### 13. Updated `src/app/dashboard/layout.tsx` — Navigation
- Added `BookMarked` icon import from lucide-react
- Added "Reading Lists" nav item to READER role: `{ label: "Reading Lists", href: "/dashboard/reading-lists", icon: BookMarked }`

## Build Verification
- `npx prisma generate` — successful
- `bun run db:push` — database in sync
- `npx eslint` — no errors in modified/created files
- `npx next build` — compiled successfully with `/dashboard/reading-lists` and `/list/[slug]` routes listed
