---
phase: 15-google-places-api-venue-ux
plan: "05"
subsystem: database
tags: [postgres, postgis, supabase, check-in, proximity, ST_DWithin]

requires:
  - phase: 029_party_trust_calibration
    provides: check_in_to_place_v2 function with 5-minute cooldown and 100m distance threshold

provides:
  - SQL migration reducing check_in_to_place_v2 proximity threshold from 100m to 10m
  - Awaiting human application of migration to Supabase

affects:
  - check-in flow (users will be rejected if > 10m from venue)
  - testing (must be physically within 10m or mock location accordingly)

tech-stack:
  added: []
  patterns:
    - "CREATE OR REPLACE FUNCTION migration pattern: full body copied with targeted threshold change"

key-files:
  created:
    - supabase/migrations/20260219_update_checkin_proximity_threshold.sql
  modified: []

key-decisions:
  - "Use full CREATE OR REPLACE FUNCTION body in migration (not ALTER) for clarity and idempotency"
  - "ST_DWithin with geography SRID 4326 uses meters as unit — changing argument from 100 to 10 is exact"

patterns-established:
  - "Proximity migration pattern: copy full function body, change single threshold, add VENUE-UX comment"

requirements-completed:
  - VENUE-UX-06

duration: 5min
completed: 2026-02-19
---

# Phase 15 Plan 05: Proximity Threshold Migration Summary

**SQL migration reducing check_in_to_place_v2 ST_DWithin distance from 100m to 10m, awaiting human application to Supabase**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-19T13:26:57Z
- **Completed:** 2026-02-19T13:32:00Z
- **Tasks:** 1 of 2 complete (Task 2 is human-action checkpoint)
- **Files modified:** 1

## Accomplishments
- Identified exact location of 100m threshold in 029_party_trust_calibration.sql (ST_DWithin argument)
- Created complete, runnable migration with full `CREATE OR REPLACE FUNCTION` body
- Changed only the distance argument from `100` to `10` — all other logic unchanged
- Committed migration for repository audit trail before human applies it

## Task Commits

1. **Task 1: Create SQL migration for 10m proximity threshold** - `19b7e11` (feat)

## Files Created/Modified
- `supabase/migrations/20260219_update_checkin_proximity_threshold.sql` - Full CREATE OR REPLACE FUNCTION for check_in_to_place_v2 with 10m distance threshold

## Decisions Made
- Used full function body (not ALTER) so migration is self-contained and idempotent
- ST_DWithin with geography type uses meters natively — `100` → `10` is the exact change needed

## Deviations from Plan

None — plan executed exactly as written. The plan suggested a placeholder SQL with documentation comments; instead I used the actual full function body from 029_party_trust_calibration.sql since it was available in the codebase. This makes the migration immediately runnable without any manual lookup.

## User Setup Required

**Human action required.** Apply the migration in Supabase:

1. Open Supabase Dashboard -> SQL Editor
2. Paste and run the contents of `supabase/migrations/20260219_update_checkin_proximity_threshold.sql`
3. Verify by running:
   ```sql
   SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'check_in_to_place_v2';
   ```
   Confirm the distance argument shows `10` (not `100`).

## Next Phase Readiness
- Migration file is committed and ready to apply
- After human applies the migration, Task 2 is complete and Phase 15 Plan 05 is fully done
- check_in_to_place_v2 will reject users > 10m from venue

---
*Phase: 15-google-places-api-venue-ux*
*Completed: 2026-02-19*
