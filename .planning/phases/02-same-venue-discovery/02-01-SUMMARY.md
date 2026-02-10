---
phase: 02-same-venue-discovery
plan: 01
subsystem: database
tags: [supabase, postgresql, rpc, visibility, check-in, discovery]

# Dependency graph
requires:
  - phase: 01-check-in-trust-core
    provides: check_in_to_place_v2 RPC with trust boundary, check_ins table, get_users_at_venue RPC
provides:
  - visibility column on check_ins table (public/friends_only/private)
  - updated check_in_to_place_v2 with p_visibility parameter
  - updated get_users_at_venue with checked_in_at recency and visibility filtering
affects: [02-same-venue-discovery, 03-safety-and-moderation-enforcement]

# Tech tracking
tech-stack:
  added: []
  patterns: [visibility enum via CHECK constraint, backward-compatible column defaults]

key-files:
  created:
    - supabase/migrations/022_add_check_in_visibility.sql
    - supabase/migrations/023_update_venue_users_rpc.sql
  modified: []

key-decisions:
  - "Visibility stored as TEXT with CHECK constraint (not enum) for simpler migration"
  - "Default 'public' ensures backward compatibility with all existing check-ins"
  - "friends_only deferred to Phase 3 when friendship model exists — column ready now"
  - "No GRANT needed for get_users_at_venue update — CREATE OR REPLACE preserves permissions"

patterns-established:
  - "Visibility enum pattern: TEXT + CHECK constraint for extensible value sets"
  - "RPC return expansion: add columns to RETURNS TABLE for client-side computation"

# Metrics
duration: 1min
completed: 2026-02-10
---

# Phase 2 Plan 1: Server-Side Visibility & Recency Schema Summary

**Visibility column on check_ins with CHECK constraint, check_in_to_place_v2 accepting p_visibility, and get_users_at_venue returning checked_in_at with public-only filtering**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-10T19:16:18Z
- **Completed:** 2026-02-10T19:17:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added visibility column to check_ins table with public/friends_only/private CHECK constraint
- Updated check_in_to_place_v2 RPC to accept and persist p_visibility parameter (14 params)
- Updated get_users_at_venue RPC to return checked_in_at for recency indicators and filter out non-public check-ins

## Task Commits

Each task was committed atomically:

1. **Task 1: Add visibility column to check_ins and update check_in_to_place_v2** - `7651ffc` (feat)
2. **Task 2: Update get_users_at_venue RPC with visibility filter and recency data** - `ae731fe` (feat)

## Files Created/Modified
- `supabase/migrations/022_add_check_in_visibility.sql` - Adds visibility column, CHECK constraint, and updated check_in_to_place_v2 with p_visibility param
- `supabase/migrations/023_update_venue_users_rpc.sql` - Updates get_users_at_venue with checked_in_at return and c.visibility = 'public' filter

## Decisions Made
- Used TEXT + CHECK constraint instead of PostgreSQL ENUM for visibility values — simpler migration, no custom type needed
- Default 'public' ensures backward compatibility — all existing check-ins remain visible without data migration
- friends_only filtering deferred to Phase 3 when friendship model exists, but column is schema-ready now
- No GRANT EXECUTE needed for get_users_at_venue — CREATE OR REPLACE preserves existing permissions from 011

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Server-side schema ready for client integration
- Ready for 02-02-PLAN.md: client visibility selector in check-in modal + recency indicators on discover screen

## Self-Check: PASSED

All files exist on disk. All commits verified in git log.

---
*Phase: 02-same-venue-discovery*
*Completed: 2026-02-10*
