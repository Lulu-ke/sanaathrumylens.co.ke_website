---
Task ID: 1
Agent: Main Agent
Task: Fix reader→moderator redirect bug and enhance moderator role

Work Log:
- Diagnosed root cause: stale x-user-role cookie persists after sign-out, causing readers to be misidentified as moderators by middleware
- Fixed sign-out flow: added x-user-role cookie clearing in dashboard layout (both domain-scoped and path-scoped)
- Fixed sign-in flow: clear stale cookie before setting new role in signin-form.tsx
- Fixed middleware: added shouldClearStaleCookie flag to clear x-user-role when no session exists
- Removed "Posts" nav item from MODERATOR roleNavItems, replaced with "Flagged" nav item
- Added Flag import to layout.tsx (was missing, caused build error)
- Added role guards to posts listing page: canCreatePost, canEditPost, canDeletePost
- Moderators now see read-only "Posts Overview" with "View on Site" action instead of "Edit"/"Delete"
- Added FlaggedContent model to Prisma schema with status, reason, review tracking
- Created /api/flagged GET/POST endpoints and /api/flagged/[id] PATCH endpoint
- Created /dashboard/flagged page with stats, filter tabs, and review actions
- Created FlagCommentButton component for reporting comments
- Integrated FlagCommentButton into comment-section.tsx (both main comments and replies)
- Updated moderation page to link to dedicated flagged content page
- Updated moderator dashboard stats to be moderation-focused (not post-focused)
- Added /api/flagged to middleware apiRoleRequirements
- Build succeeded, pushed to GitHub (auto-deploys to Vercel)

Stage Summary:
- Reader→moderator redirect bug fixed (stale cookie clearing)
- Moderator sidebar now shows: Dashboard, Comments, Moderation, Flagged, Profile
- Posts page is read-only for moderators
- Complete flagged content system: model, API, dashboard page, report button on comments
- All changes deployed via GitHub push to Vercel
