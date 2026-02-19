---
phase: 16-interaction-types-wave-like
plan: 01
subsystem: database
tags: [postgresql, triggers, rpc, security-definer, realtime, interactions, matching]

# Dependency graph
requires:
  - phase: 08-drink-offers
    provides: matches table with CHECK user1_id < user2_id, drinks table
  - phase: 13-check-in-testing
    provides: check_ins table with is_active, checked_out_at
  - phase: 14-availability-toggle
    provides: users.is_available column, send_drink_offer_v2 availability check pattern
provides:
  - interactions table for all three interaction types (drink, wave, like)
  - send_interaction SECURITY DEFINER RPC with full server validation
  - get_received_interactions RPC for "Quem te curtiu" section
  - check_and_create_match_v2 trigger for any-combo mutual matching
  - unmatched_at column on matches for soft-delete unmatch
  - interactions table in supabase_realtime publication
affects: [16-02, 16-03, 16-04, chat]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ANY-combo matching: trigger checks reverse interaction without type filter"
    - "is_match detection: RPC queries matches table after trigger fires in same transaction"
    - "ON CONFLICT re-match: clears unmatched_at when re-matching after unmatch"

key-files:
  created:
    - supabase/migrations/032_create_interactions.sql
    - supabase/migrations/033_send_interaction_rpc.sql
    - supabase/migrations/034_get_received_interactions_rpc.sql
  modified: []

key-decisions:
  - "TEXT CHECK constraint for interaction_type (consistent with project pattern, not Postgres ENUM)"
  - "ON CONFLICT clears unmatched_at to enable re-matching after unmatch"
  - "Photos join uses order=1 (schema is 1-indexed, not 0-indexed as plan stated)"

patterns-established:
  - "ANY-combo matching: check_and_create_match_v2 checks for any reverse interaction, regardless of type"
  - "is_match in RPC response: query matches after trigger fires to report match to client immediately"
  - "Unmatch via unmatched_at: soft-delete pattern on matches table"

requirements-completed: [INTERACT-01, INTERACT-02, INTERACT-03, INTERACT-04]

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 16 Plan 01: Database Foundation Summary

**Interactions table with TEXT CHECK constraint, any-combo match trigger v2, send_interaction RPC with is_match detection, and get_received_interactions RPC for active check-in filtering**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-19T15:52:12Z
- **Completed:** 2026-02-19T15:53:50Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created interactions table supporting drink/wave/like types with UNIQUE constraint including interaction_type
- Built check_and_create_match_v2 trigger that matches ANY mutual interaction regardless of type combination
- Implemented send_interaction RPC with 7-step server validation and is_match detection
- Created get_received_interactions RPC that filters by active check-in status and includes sender photo
- Added unmatched_at column to matches for soft-delete unmatch support
- Enabled realtime for interactions table

## Task Commits

Each task was committed atomically:

1. **Task 1: Create interactions table, match trigger v2, and unmatch support** - `efcc8bb` (feat)
2. **Task 2: Create send_interaction RPC and get_received_interactions RPC** - `ad88b01` (feat)

## Files Created/Modified
- `supabase/migrations/032_create_interactions.sql` - Interactions table, match trigger v2, unmatch support
- `supabase/migrations/033_send_interaction_rpc.sql` - send_interaction SECURITY DEFINER RPC with full validation
- `supabase/migrations/034_get_received_interactions_rpc.sql` - get_received_interactions RPC + realtime publication

## Decisions Made
- Used TEXT CHECK constraint for interaction_type (consistent with project pattern, avoids Postgres ENUM)
- ON CONFLICT in match trigger clears unmatched_at to enable re-matching after unmatch
- Photos join uses `"order" = 1` (schema is 1-indexed per CHECK constraint, not 0-indexed as plan stated)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed photos join order index**
- **Found during:** Task 2 (get_received_interactions RPC)
- **Issue:** Plan specified `p."order" = 0` for first photo, but photos table CHECK constraint is `"order" >= 1 AND "order" <= 3` (1-indexed)
- **Fix:** Changed to `p."order" = 1` to correctly reference the first photo
- **Files modified:** supabase/migrations/034_get_received_interactions_rpc.sql
- **Verification:** Cross-referenced with 003_create_photos.sql schema
- **Committed in:** ad88b01 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix — query would return no photos with wrong index. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Database foundation complete, ready for Plan 02 (service layer and TypeScript types)
- All three RPCs available for client-side integration
- Realtime subscription ready for interactions table

## Self-Check: PASSED

All 3 migration files verified on disk. Both task commits (efcc8bb, ad88b01) verified in git log.

---
*Phase: 16-interaction-types-wave-like*
*Completed: 2026-02-19*
