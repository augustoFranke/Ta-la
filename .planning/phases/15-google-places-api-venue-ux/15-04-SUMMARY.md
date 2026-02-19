---
phase: 15-google-places-api-venue-ux
plan: "04"
subsystem: home-screen
tags: [venue-ux, check-in, home-screen, cleanup]
dependency_graph:
  requires: ["15-03"]
  provides: ["rebuilt-home-screen", "no-venue-detail-route"]
  affects: ["app/(tabs)/index.tsx", "app/venue/[id].tsx", "app/_layout.tsx"]
tech_stack:
  added: []
  patterns: ["VenueCard vertical list", "skeleton loading", "non-blocking location banner"]
key_files:
  created: []
  modified:
    - "app/(tabs)/index.tsx"
    - "app/_layout.tsx"
  deleted:
    - "app/venue/[id].tsx"
decisions:
  - "Check-in always open_to_meeting: false and visibility: 'public' — no toggles"
  - "Empty state has no retry button — non-blocking, informational only"
  - "Location error is a banner, not a full-screen blocker"
metrics:
  duration: 8
  completed: 2026-02-19
  tasks_completed: 2
  files_changed: 3
---

# Phase 15 Plan 04: Home Screen Rebuild & Venue Detail Removal Summary

Home screen rebuilt with vertical VenueCard list, skeleton/empty/banner states, and check-in flow wired directly; /venue/[id] route deleted entirely.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite home screen with venue cards, skeleton, empty state, location banner | aaef74b | app/(tabs)/index.tsx |
| 2 | Delete venue detail page (CLEAN-03) | 39eecf2 | app/venue/[id].tsx (deleted), app/_layout.tsx |

## What Was Built

### Task 1: Home Screen Rewrite

`app/(tabs)/index.tsx` was completely rewritten:

- **Vertical ScrollView** of full-width VenueCards (`screenWidth - 32` wide, 16px gap)
- **Skeleton loading**: 3 `VenueCardSkeleton` components instead of `ActivityIndicator`
- **Empty state**: `Ionicons "map-outline"` size 64 + "Nenhum lugar encontrado por aqui" text, paddingTop 60, no retry button
- **Location error banner**: Non-blocking row with `"alert-circle-outline"` icon (color `#FF9800`) + message text. Shows when `!permissionGranted` OR `error` is present.
- **CheckInModal wiring**: `checkInVenue` state drives visibility; `onConfirm` calls `checkInToPlace` with `open_to_meeting: false`, `visibility: 'public'`; errors shown via `Alert.alert`
- **Removed**: search bar, "Em alta" section, `trendingVenues` useMemo, `useRouter`, `setSelectedVenue`, `router.push('/venue/...')`, `ActivityIndicator`, `TextInput`, horizontal carousel

### Task 2: Delete Venue Detail Page (CLEAN-03)

- `app/venue/[id].tsx` deleted entirely
- `venue/[id]` Stack.Screen entry removed from `app/_layout.tsx`
- Zero references to `/venue/[id]` remain in the codebase

## Verification Results

1. `npx tsc --noEmit` — PASSED
2. `ls app/venue/[id].tsx` — No such file or directory
3. `grep -rn "venue/\[id\]" app/ src/` — NO MATCHES
4. Home screen imports: VenueCard, VenueCardSkeleton, CheckInModal — all present
5. "Nenhum lugar encontrado por aqui" — present in index.tsx
6. `ActivityIndicator` — NOT in index.tsx (replaced by skeletons)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing cleanup] Removed venue/[id] Stack.Screen from app/_layout.tsx**
- **Found during:** Task 2
- **Issue:** After deleting the file, `app/_layout.tsx` still declared a `Stack.Screen name="venue/[id]"`. This is a dead reference that would cause Expo Router warnings.
- **Fix:** Removed the `Stack.Screen` block for `venue/[id]` from `_layout.tsx`
- **Files modified:** `app/_layout.tsx`
- **Commit:** 39eecf2

## Self-Check: PASSED

- app/(tabs)/index.tsx: FOUND
- app/venue/[id].tsx: CONFIRMED DELETED
- Commit aaef74b: FOUND
- Commit 39eecf2: FOUND
