---
phase: 06-party-experience
plan: 03
subsystem: realtime, ui
tags: [supabase-realtime, postgres-changes, debounce, presence-confirmation, react-native]

# Dependency graph
requires:
  - phase: 06-party-experience
    provides: is_available column, check_ins realtime publication, usePresenceConfirmation hook, PresenceConfirmationModal, checkOut function
provides:
  - useVenueRealtime hook for live venue roster subscription
  - Discover screen with integrated realtime updates and presence confirmation
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase Realtime postgres_changes with venue-specific channel and 300ms debounce"
    - "Stable ref pattern for callbacks to prevent channel recreation on re-renders"

key-files:
  created:
    - src/hooks/useVenueRealtime.ts
  modified:
    - app/(tabs)/discover.tsx

key-decisions:
  - "Debounce realtime events at 300ms to prevent rapid-fire RPC calls from simultaneous check-in/out events"
  - "Store onRosterChange in useRef to keep channel stable across re-renders"

patterns-established:
  - "Realtime subscription: channel per venue, debounce callback, cleanup on unmount/venue change"
  - "Integration pattern: hook-level wiring with no payload parsing — just trigger refetch"

# Metrics
duration: 1min
completed: 2026-02-11
---

# Phase 06 Plan 03: Realtime Integration Summary

**Supabase Realtime venue subscription hook with 300ms debounce and discover screen integration for live roster updates and presence confirmation prompts**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-11T14:31:28Z
- **Completed:** 2026-02-11T14:32:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created useVenueRealtime hook subscribing to postgres_changes on check_ins filtered by venue_id with 300ms debounce
- Integrated realtime venue roster updates into discover screen — list auto-refreshes on check-in/out events
- Wired presence confirmation into discover screen — "Ainda esta aqui?" modal after 30 minutes, deny triggers checkout

## Task Commits

Each task was committed atomically:

1. **Task 1: Realtime venue subscription hook** - `d0fd6d6` (feat)
2. **Task 2: Integrate realtime and presence confirmation into discover screen** - `e4ce447` (feat)

## Files Created/Modified
- `src/hooks/useVenueRealtime.ts` - Supabase Realtime hook: subscribes to check_ins changes per venue, debounces at 300ms, cleans up on unmount
- `app/(tabs)/discover.tsx` - Added useVenueRealtime, usePresenceConfirmation, PresenceConfirmationModal integration, handleDenyPresence callback

## Decisions Made
- Debounce realtime events at 300ms — prevents rapid-fire RPC calls when multiple users check in/out simultaneously
- Store onRosterChange in useRef — prevents Supabase channel recreation on every render cycle
- Don't parse realtime payload — just trigger refetch via existing get_users_at_venue RPC which handles all filtering server-side

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 06 (Party Experience) is now complete — all 3 plans executed
- Discover screen is fully live: realtime roster updates, presence confirmation, availability gating
- Ready for next phase or milestone completion

## Self-Check: PASSED

- All 2 key files found on disk
- Both feat commits (d0fd6d6, e4ce447) present in git log

---
*Phase: 06-party-experience*
*Completed: 2026-02-11*
