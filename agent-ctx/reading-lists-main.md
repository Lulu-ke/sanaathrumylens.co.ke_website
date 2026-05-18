# Task: Reading Lists / Collections

## Summary
Implemented complete Reading Lists / Collections feature for the Sanaa Through My Lens blog, allowing users (READER+) to group bookmarks into named collections.

## What Was Built

### Database Layer
- Added `ReadingList` and `ReadingListItem` models to Prisma schema
- Updated User model with `readingLists` relation
- Updated Post model with `readingListItems` relation
- Ran `prisma generate` and `db:push` successfully

### API Endpoints
- `GET/POST /api/reading-lists` — List user's lists or public lists; create new list
- `GET/PATCH/DELETE /api/reading-lists/[id]` — Get/update/delete individual list (owner checks)
- `POST/DELETE /api/reading-lists/[id]/items` — Add/remove posts from lists

### Public Pages
- `/list/[slug]` — Public reading list page with SEO metadata, PostCard grid, author info
- Returns 404 for private lists accessed by non-owners

### Dashboard
- `/dashboard/reading-lists` — Full management interface with:
  - Grid of list cards with thumbnails, public/private badges
  - Create/Edit/Delete list dialogs
  - List detail view with items and remove capability
  - Add bookmarked posts to lists via dialog

### Bookmark Button Enhancement
- After bookmarking, shows `ListPlus` dropdown button
- Dropdown fetches reading lists lazily
- Shows add status with checkmarks and loading spinners
- "Create new list" link when no lists exist

### Navigation & Security
- Added "Reading Lists" to READER dashboard sidebar with `BookMarked` icon
- Added `/api/reading-lists` → READER to middleware `apiRoleRequirements`
- Added `/dashboard/reading-lists` to `allowedReaderPaths` in middleware

## Build Status
- `npx next build` — successful
- No lint errors in changed files
- All routes compiled and listed in build output
