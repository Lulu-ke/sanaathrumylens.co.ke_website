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
