---
Task ID: 3a
Agent: Main Agent
Task: Phase 3 Critical Fixes - profile updates, forgot password, 2FA, media delete, push notifications, SMTP settings

Work Log:

1. **Fixed Profile Update API** (`src/app/api/users/[id]/route.ts`)
   - Changed PATCH endpoint to allow self-updates without SUPER_ADMIN
   - Users can now update their own profile (name, bio, image, username)
   - Users can change their own password with currentPassword verification (using bcryptjs compare)
   - Only SUPER_ADMIN can change role and isActive fields for other users
   - Added `password` and `currentPassword` fields to the update schema
   - Self-update logic strips role/isActive from validated data

2. **Added Forgot Password Flow**
   - Created `src/app/auth/forgot-password/page.tsx` — UI with email input, success message, link back to sign-in
   - Created `src/app/auth/reset-password/page.tsx` — UI with password + confirm fields, token from URL query param, success state
   - Created `src/app/api/auth/forgot-password/route.ts` — POST endpoint that generates crypto.randomBytes token, saves to VerificationToken model with 1hr expiry, sends email if SMTP configured or logs for dev
   - Created `src/app/api/auth/reset-password/route.ts` — POST endpoint that validates token, hashes new password, updates user, deletes used token
   - Updated `src/app/auth/signin/components/signin-form.tsx` — Added "Forgot Password?" link next to "Remember me" checkbox

3. **Added Media Delete API Endpoint** (`src/app/api/media/[id]/route.ts`)
   - DELETE endpoint requiring AUTHOR+ permission
   - Deletes physical file from public/uploads/ using unlinkSync
   - Deletes database record
   - Gracefully handles file deletion failures (continues with DB deletion)

4. **Fixed 2FA Implementation** (`src/app/api/auth/2fa/route.ts`)
   - POST (verify): Now also sets `twoFactorEnabled = true` on successful verification
   - PUT (enable): Generates 6-digit OTP via generateOTP(), saves to user.twoFactorCode/twoFactorExp (10min), sends via sendOTPEmail, returns devCode if SMTP not configured
   - DELETE (disable): Requires currentPassword verification with bcryptjs compare, sets twoFactorEnabled=false, clears code/exp

5. **Added SMTP Password to Settings**
   - Updated `src/app/dashboard/settings/page.tsx` — Added SMTP Password input field (type="password") between SMTP User and Newsletter From Name
   - Updated `prisma/seed.ts` — Added smtp_host, smtp_port, smtp_user, smtp_pass, newsletter_from_name seed settings

6. **Added Push Notification API Routes**
   - `src/app/api/push/subscribe/route.ts` — POST: Upserts push subscription by userId + endpoint with p256dh and auth keys
   - `src/app/api/push/unsubscribe/route.ts` — POST: Deletes push subscription by endpoint (with ownership verification)

7. **Added Profile Fetch API** (`src/app/api/users/me/route.ts`)
   - GET endpoint returning current user's full profile (id, email, name, username, role, image, bio, twoFactorEnabled, etc.)
   - Uses session to identify user, no role restriction

8. **Updated Prisma Schema**
   - Added `twoFactorEnabled Boolean @default(false)` to User model
   - Ran `npx prisma generate` and `bun run db:push` to sync

9. **Updated Profile Page** (`src/app/dashboard/profile/page.tsx`)
   - Fetches user profile on load via /api/users/me (using TanStack Query)
   - Initializes bio, image, name, twoFactorEnabled from profile data
   - Enable 2FA: calls PUT /api/auth/2fa, shows OTP input with dev code display
   - Verify 2FA: calls POST /api/auth/2fa with the code
   - Disable 2FA: shows password confirmation dialog, calls DELETE /api/auth/2fa
   - Proper loading states on all mutations

10. **Lint Fixes**
    - Replaced useEffect-based state initialization with React render-time initialization pattern (matching settings page pattern) to fix react-hooks/set-state-in-effect lint error

Commit: feat: Phase 3 critical fixes - profile updates, forgot password, 2FA, media delete, push notifications, SMTP settings
