---
phase: 06-party-experience
plan: 01
subsystem: database, ui
tags: [supabase, sql, realtime, react-native, switch, availability]

# Dependency graph
requires:
  - phase: 05-tech-debt-and-party-foundation
    provides: is_available field on User TypeScript type, deep link support
provides:
  - is_available column on users table with NOT NULL DEFAULT TRUE
  - send_drink_offer_v2 RPC with receiver availability check (receiver_unavailable error code)
  - check_ins table added to supabase_realtime publication for Postgres Changes
  - Availability toggle UI on profile screen with optimistic update pattern
affects: [06-party-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optimistic toggle: update Zustand store immediately, persist to Supabase, revert on error"
    - "ALTER PUBLICATION supabase_realtime ADD TABLE for enabling Realtime on a table"

key-files:
  created:
    - supabase/migrations/027_add_is_available.sql
    - supabase/migrations/028_enable_realtime_check_ins.sql
  modified:
    - app/(tabs)/profile/index.tsx

key-decisions:
  - "COALESCE(v_receiver_available, TRUE) for defensive NULL handling in RPC"
  - "Availability toggle placed between Interests and Settings on profile screen"

patterns-established:
  - "Optimistic toggle with error revert: setUser optimistic → supabase update → revert on catch"

# Metrics
duration: 2min
completed: 2026-02-11
---

# Phase 6 Plan 1: Availability & Realtime Foundation Summary

**SQL migrations for is_available column with server-enforced drink gating, realtime publication on check_ins, and availability toggle UI on profile screen**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-11T14:23:46Z
- **Completed:** 2026-02-11T14:25:46Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `is_available` column to users table with `NOT NULL DEFAULT TRUE`
- Updated `send_drink_offer_v2` RPC to check receiver availability before allowing drink offers (returns `receiver_unavailable` error code, already mapped client-side)
- Enabled Supabase Realtime on `check_ins` table via `supabase_realtime` publication
- Added availability toggle UI to profile screen with optimistic update pattern and error revert

## Task Commits

Each task was committed atomically:

1. **Task 1: SQL migrations for is_available and realtime publication** - `5b84fc7` (feat)
2. **Task 2: Availability toggle UI on profile screen** - `3f647a1` (feat)

## Files Created/Modified
- `supabase/migrations/027_add_is_available.sql` - ALTER TABLE + updated send_drink_offer_v2 RPC with receiver availability check
- `supabase/migrations/028_enable_realtime_check_ins.sql` - Enables Postgres Changes on check_ins via supabase_realtime publication
- `app/(tabs)/profile/index.tsx` - Added Switch toggle for availability with optimistic update, Ionicons icon, pt-BR text

## Decisions Made
- Used `COALESCE(v_receiver_available, TRUE)` to defensively handle NULL values in the is_available column check
- Placed the availability toggle between Interests and Settings sections on the profile screen for discoverability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Database foundation for party experience complete (is_available column + realtime publication)
- Ready for next plans: realtime venue roster hook, presence confirmation prompts, discover screen integration

---
*Phase: 06-party-experience*
*Completed: 2026-02-11*
