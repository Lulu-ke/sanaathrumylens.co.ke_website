# Task 3b: Offline Capabilities + Auto-Save for Posts

## Work Summary

Implemented a complete offline-first writing experience with auto-save for the "Sanaa Through My Lens" blog/CMS project.

## Files Created

1. **`src/lib/offline-db.ts`** — IndexedDB wrapper with full CRUD for drafts and pending operations
   - `OfflineDraft` and `PendingOperation` types
   - Drafts: `saveDraft`, `getDraft`, `getDraftsByType`, `getAllDrafts`, `deleteDraft`, `clearSyncedDrafts`, `findDraft`
   - Pending Ops: `addPendingOperation`, `getPendingOperations`, `removePendingOperation`, `clearPendingOperations`
   - Sync helper: `syncPendingOperations` — processes queued ops against the server API

2. **`src/hooks/use-online-status.ts`** — Online/offline detection using `useSyncExternalStore` (React 19 compliant)
   - Subscribes to `window.online`/`window.offline` events
   - SSR-safe with `getServerSnapshot` returning `true`

3. **`src/hooks/use-auto-save.ts`** — Auto-save hook with debouncing and periodic saves
   - Saves to IndexedDB every 30s (configurable) and 2s after data changes (debounced)
   - Periodic server save every 60s when online
   - Queues pending operations when offline
   - Syncs pending operations when coming back online
   - Tracks save status: `idle` | `saving` | `saved` | `offline` | `error`
   - Detects unsaved changes by comparing serialized data
   - Exposes `saveNow()` for manual saves

4. **`src/components/editor/save-status-indicator.tsx`** — Visual save status indicator
   - Shows: ✓ Saved / ⏳ Saving... / 📡 Offline (saved locally) / ⚠ Unsaved changes / ❌ Error saving
   - Color-coded with emerald/amber/destructive colors
   - Shows relative time for last save

5. **`src/components/editor/offline-banner.tsx`** — Dismissible amber offline banner
   - "You're offline — your work is being saved locally and will sync when you're back online"
   - Auto-reappears on each new offline session
   - Dismissible per session

## Files Modified

6. **`public/sw.js`** — Enhanced service worker with:
   - Install/activate lifecycle with cache management
   - Fetch handler: network-first with cache fallback
   - Background Sync API listener (`sync-pending-operations`)
   - IndexedDB-based sync logic in the service worker context
   - Notification on successful sync

7. **`src/app/dashboard/posts/new/page.tsx`** — New Post page with offline + auto-save:
   - Generates stable draft ID per session
   - Auto-saves form data via `useAutoSave` hook
   - Draft recovery banner: "You have an unsaved draft from [time]. Resume editing?"
   - Save Status Indicator in header
   - Offline Banner at top when disconnected
   - "Save Draft" → "Save Offline" when offline (CloudOff icon)
   - "Submit for Review" disabled when offline
   - "Schedule" button disabled when offline
   - Image upload blocked when offline
   - Tag creation blocked when offline
   - Draft cleanup after successful server save

8. **`src/app/dashboard/posts/[id]/edit/page.tsx`** — Edit Post page with same pattern:
   - Draft ID based on postId for consistency
   - Draft recovery after post data loads
   - All offline adaptations same as new post page
   - Review actions (approve/reject) blocked when offline

## Technical Decisions

- Used `useSyncExternalStore` for `useOnlineStatus` to comply with React 19 lint rules (no `setState` in effects)
- Used module-level offline session counter for `OfflineBanner` to avoid ref access during render (React 19 lint)
- No external npm packages added — all IndexedDB logic implemented with native browser APIs
- All new features are additive — existing online functionality works exactly as before
