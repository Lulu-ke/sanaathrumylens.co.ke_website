---
Task ID: 3-4
Agent: full-stack-developer
Task: Build Authentication System + All API Routes

Work Log:
- Created auth configuration (src/lib/auth.ts) with NextAuth v4 — Credentials provider (email/password), Google OAuth provider, JWT strategy, session callback with role/username, custom signIn page
- Created auth helpers (src/lib/auth-helpers.ts) — hashPassword, verifyPassword, generateOTP, sendOTPEmail, createDashboardUser, hasPermission, canAccessDashboard, ROLE_HIERARCHY, generateSlug, generateUniqueSlug
- Created auth API route (src/app/api/auth/[...nextauth]/route.ts) — NextAuth handler
- Created 2FA OTP API route (src/app/api/auth/2fa/route.ts) — POST verify OTP with in-memory rate limiting
- Created User Management API routes — GET (paginated, role-filtered), POST (SUPER_ADMIN only), [id] GET/PATCH/DELETE with role-based access
- Created Posts API routes — GET (paginated, filtered by status/category/author/search), POST (AUTHOR+), [id] GET/PATCH/DELETE with ownership/role checks, [id]/review POST (author submit) + PATCH (editor approve/reject), [id]/revisions GET + POST
- Created Categories API routes — GET (public), POST (EDITOR+), [id] PATCH/DELETE (EDITOR+)
- Created Tags API routes — GET (public), POST (EDITOR+), [id] PATCH/DELETE (EDITOR+)
- Created Comments API routes — GET (MODERATOR+), POST (any authenticated), [id] PATCH (moderate: MODERATOR+) + DELETE (author own or MODERATOR+)
- Created Events API routes — GET (paginated, filtered by date/city/category), POST (EDITOR+), [id] GET/PATCH/DELETE (EDITOR+)
- Created Newsletter API routes — POST subscribe (public), POST unsubscribe (public, token-based)
- Created Media Upload API route — GET (paginated, authenticated), POST (file upload to /public/uploads/, AUTHOR+)
- Created Bookmarks API routes — GET (user bookmarks), POST (add), [postId] DELETE (remove)
- Created Dashboard Stats API route — GET counts + recent posts/comments/upcoming events (MODERATOR+)
- Created Ads API routes — GET (public for active, admin sees all), POST (ADMIN+), [id] PATCH/DELETE (ADMIN+)
- Created Site Settings API routes — GET (public), PUT (SUPER_ADMIN only, upsert)
- Created seed script (prisma/seed.ts) — SUPER_ADMIN, editor, author, moderator, reader users; 8 categories; 20 tags; 5 posts (3 published, 1 draft, 1 pending review); 3 events; 15 site settings; newsletter subscribers; sample comments
- Created Edge-compatible middleware (src/middleware.ts) — JWT cookie parsing for role checks, dashboard route protection, API route protection with role hierarchy, public GET endpoints
- Fixed Edge runtime issue by removing Node.js module imports from middleware, using manual JWT payload parsing instead of getToken
- All API endpoints tested and working: categories, tags, events, posts, settings, ads, auth, newsletter
- Protected endpoints return 401 when unauthenticated, role-based access works correctly
- Lint passes cleanly

Stage Summary:
- Complete authentication system with NextAuth v4 (Credentials + Google OAuth, JWT strategy, role-based sessions)
- 16 API route groups covering all CMS functionality (users, posts, categories, tags, comments, events, newsletter, media, bookmarks, dashboard stats, ads, settings, 2FA)
- All routes have proper error handling, Zod validation, role-based access control
- Database seeded with comprehensive sample data (5 users, 8 categories, 20 tags, 5 posts, 3 events, 15 settings)
- Edge-compatible middleware with JWT cookie-based auth checks
- Login credentials: admin@sanaathrumylens.co.ke / Admin@2024!
