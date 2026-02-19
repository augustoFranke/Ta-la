---
phase: 14-cleanup-navigation-restructure
plan: "01"
subsystem: services, auth
tags: [dead-code, cleanup, logout, stores]
dependency_graph:
  requires: []
  provides: [clean-services, logout-store-reset]
  affects: [src/services/places.ts, src/services/notifications.ts, src/services/moderation.ts, src/hooks/useAuth.ts]
tech_stack:
  added: []
  patterns: [zustand-getState-outside-component]
key_files:
  created: []
  modified:
    - src/services/places.ts
    - src/services/notifications.ts
    - src/services/moderation.ts
    - src/hooks/useAuth.ts
decisions:
  - "Preserve venues cache on logout — venue data is not user-specific and expensive to refetch"
  - "Use .getState() pattern for Zustand store calls outside React components"
metrics:
  duration: ~10min
  completed_date: 2026-02-19
  tasks_completed: 2
  files_modified: 4
---

# Phase 14 Plan 01: Dead Code Removal and Logout Store Reset Summary

Remove 3 dead service functions, 1 redundant re-export, and wire 4 user-scoped store resets into signOut.

## What Was Built

- Deleted `getPhotoUrl` stub and `VENUE_TYPE_SCORES`/`getVenueTypeScore` re-export from `places.ts`
- Deleted `checkShouldNotify` from `notifications.ts`; removed now-unused `NotificationCategory` import
- Deleted `unblockUser` from `moderation.ts`
- Updated `signOut` in `useAuth.ts` to call `reset()` on checkIn, block, and notification stores, and `setSelectedVenue(null)` on venueStore — venues array cache intentionally preserved

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Preserve venues cache on logout | Venue list is not user-specific; clearing it forces expensive re-fetch on next login |
| Use `.getState()` for store calls | signOut is a regular async function, not a React component; hook rules don't apply |

## Deviations from Plan

**1. [Rule 2 - Missing cleanup] Removed unused NotificationCategory import**
- Found during: Task 1
- Issue: After removing `checkShouldNotify`, `NotificationCategory` was imported but unused — would cause a TS warning
- Fix: Removed from the import line in `notifications.ts`
- Files modified: src/services/notifications.ts
- Commit: 2e64d07

Otherwise — plan executed exactly as written.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove dead code from services | 2e64d07 | places.ts, notifications.ts, moderation.ts |
| 2 | Reset user-scoped stores on logout | 8cf4830 | useAuth.ts |

## Self-Check: PASSED

All modified files exist. Both commits (2e64d07, 8cf4830) verified in git history.
