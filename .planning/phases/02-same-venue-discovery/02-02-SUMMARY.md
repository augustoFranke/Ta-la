---
phase: 02-same-venue-discovery
plan: 02
subsystem: ui
tags: [react-native, check-in, visibility, recency, discover, expo]

# Dependency graph
requires:
  - phase: 02-same-venue-discovery
    provides: visibility column on check_ins, p_visibility in check_in_to_place_v2, checked_in_at in get_users_at_venue
provides:
  - Visibility selector UI in check-in modal (public/friends_only/private)
  - Visibility wired through venue screen to check_in_to_place_v2 RPC
  - Recency indicators on discover screen venue roster
  - CheckInVisibility TypeScript type
affects: [03-safety-and-moderation-enforcement]

# Tech tracking
tech-stack:
  added: []
  patterns: [radio-button selector for enum options, formatRecency time-ago helper]

key-files:
  created: []
  modified:
    - src/types/database.ts
    - src/components/venue/CheckInModal.tsx
    - app/venue/[id].tsx
    - src/hooks/useCheckIn.ts
    - app/(tabs)/discover.tsx

key-decisions:
  - "Visibility defaults to 'public' in both UI state and RPC fallback"
  - "Recency shown only for venue users (not search results) — checked_in_at presence determines display"
  - "Radio-button-on/off Ionicons for visibility selector indicator"

patterns-established:
  - "Radio selector pattern: TouchableOpacity rows with radio-button-on/off icons for enum selection"
  - "Time-ago helper: formatRecency with pt-BR labels (agora mesmo, ha X min, ha Xh)"

# Metrics
duration: 2min
completed: 2026-02-10
---

# Phase 2 Plan 2: Client Visibility Selector & Recency Indicators Summary

**Visibility radio selector in check-in modal (public/friends_only/private) with p_visibility RPC param, and time-ago recency badges on discover screen venue roster**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-10T19:19:58Z
- **Completed:** 2026-02-10T19:22:41Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added 3-option visibility radio selector to CheckInModal (Todos no local, Somente amigos, Privado)
- Wired visibility through venue screen → useCheckIn hook → check_in_to_place_v2 RPC via p_visibility param
- Added recency indicators (time-outline icon + "agora mesmo"/"ha X min"/"ha Xh") to venue user cards on discover screen
- Added CheckInVisibility type to database types

## Task Commits

Each task was committed atomically:

1. **Task 1: Add visibility type, update check-in modal with visibility selector, and wire through venue screen** - `53eba93` (feat)
2. **Task 2: Add recency indicators to discover screen venue roster** - `4740b5f` (feat)

## Files Created/Modified
- `src/types/database.ts` - Added CheckInVisibility type and visibility field to CheckIn interface
- `src/components/venue/CheckInModal.tsx` - Added visibility state, 3-option radio selector UI, updated onConfirm signature
- `app/venue/[id].tsx` - Updated handleConfirmCheckIn to pass visibility to checkInToPlace
- `src/hooks/useCheckIn.ts` - Added visibility to CheckInToPlaceInput, sends p_visibility to RPC
- `app/(tabs)/discover.tsx` - Added checked_in_at to VenueUser, formatRecency helper, recency row in user cards

## Decisions Made
- Visibility defaults to 'public' in both UI initial state and RPC fallback — backward compatible
- Recency shown only for venue users (not search results) since only venue users have checked_in_at
- Used radio-button-on/off Ionicons for clean visual indicator on visibility options

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 complete — both server-side (plan 01) and client-side (plan 02) for same-venue discovery
- Visibility selector and recency indicators fully wired end-to-end
- Ready for Phase 3: Safety and Moderation Enforcement

---
*Phase: 02-same-venue-discovery*
*Completed: 2026-02-10*

## Self-Check: PASSED

All files exist on disk. All commits verified in git log.
