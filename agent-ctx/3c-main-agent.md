---
Task ID: 3c
Agent: Main Agent
Task: Phase 3 remaining features - Dashboard pagination, scheduled post cron, contact page, misc fixes

Work Log:

1. **PaginationControls Component** (`src/components/ui/pagination-controls.tsx`)
   - Created reusable client component with props: currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange, pageSizeOptions
   - Shows "Showing X–Y of Z items" on the left
   - First/Prev/Next/Last page navigation buttons (disabled at boundaries)
   - Current page / total pages display
   - Page size selector (10/20/50) on the right

2. **Dashboard Pagination** - Updated all 5 dashboard list pages:
   - **Posts** (`src/app/dashboard/posts/page.tsx`): Added useSearchParams/useRouter for URL-based pagination (?page=1&limit=10), passed page/limit to API, added PaginationControls, updated response type to use `pagination` object from API
   - **Comments** (`src/app/dashboard/comments/page.tsx`): Same pattern, default limit 20
   - **Events** (`src/app/dashboard/events/page.tsx`): Same pattern, default limit 10
   - **Users** (`src/app/dashboard/users/page.tsx`): Same pattern, default limit 20
   - **Subscribers** (`src/app/dashboard/subscribers/page.tsx`): Same pattern, also updated newsletter API to support pagination

3. **Newsletter API Pagination** (`src/app/api/newsletter/route.ts`)
   - Added page/limit params support
   - Added skip/take to query
   - Returns pagination object (page, limit, total, totalPages) consistent with other APIs

4. **Scheduled Post Cron** (`src/app/api/cron/publish-scheduled/route.ts`)
   - GET endpoint that finds SCHEDULED posts where scheduledAt <= now
   - Updates each to PUBLISHED with publishedAt set
   - Verifies CRON_KEY for security (Bearer token in Authorization header)
   - Returns { published, checked } counts

5. **Vercel Cron Config** (`vercel.json`)
   - Configured cron to hit /api/cron/publish-scheduled every minute
   - Note: CRON_KEY env var should be set on Vercel for security

6. **Contact Page** (`src/app/(blog)/contact/page.tsx`)
   - Public contact form with name, email, subject (dropdown), message fields
   - Shows contact info cards: email (hello@sanaathrumylens.co.ke), location (Nairobi), response time
   - Clean design matching blog aesthetic with breadcrumbs
   - Client-side validation and loading states

7. **Contact API** (`src/app/api/contact/route.ts`)
   - POST endpoint with Zod validation
   - In-memory rate limiting: max 5 submissions per IP per hour
   - If SMTP configured (SMTP_HOST, SMTP_USER, SMTP_PASS), sends email to admin
   - If SMTP not configured, logs message for dev
   - Returns 429 if rate limited, proper error handling

8. **Subscribers AlertDialog Fix** (`src/app/dashboard/subscribers/page.tsx`)
   - Replaced `confirm('Are you sure?')` with proper shadcn/ui AlertDialog
   - Delete button now opens confirmation dialog with Cancel/Delete actions
   - Used useMutation for proper async handling

9. **ArtistItem Interface Fix** (`src/app/dashboard/artists/page.tsx`)
   - Added `coverImage: string | null` to ArtistItem interface
   - The grid view already referenced `artist.coverImage` for the cover image display

Stage Summary:
- All 5 dashboard pages now have full URL-based pagination with reusable PaginationControls component
- Scheduled posts auto-publish via Vercel Cron every minute
- Public contact page with form, rate limiting, and optional SMTP email
- Subscribers page uses proper AlertDialog instead of browser confirm()
- ArtistItem interface now includes coverImage field
- All lint checks pass (only pre-existing scripts/setup-prisma.js errors remain)
- Dev server running without errors
