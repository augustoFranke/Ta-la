---
phase: 07-trust-calibration
plan: 01
subsystem: database
tags: [postgres, check-in, trust, auto-expiry, cooldown, party]

# Dependency graph
requires:
  - phase: 01-check-in-trust-core
    provides: "check_in_to_place_v2 RPC, auto_checkout_expired function"
  - phase: 06-party-experience
    provides: "Presence confirmation (30-min interval) making longer auto-expiry safe"
provides:
  - "Party-calibrated auto-expiry (8h) and cooldown (5min) thresholds"
  - "Trust threshold reference document for all check-in parameters"
affects: [party-testing, check-in, venue-discovery]

# Tech tracking
tech-stack:
  added: []
  patterns: ["CREATE OR REPLACE for threshold calibration without schema changes"]

key-files:
  created:
    - "supabase/migrations/029_party_trust_calibration.sql"
    - ".planning/TRUST_THRESHOLDS.md"
  modified: []

key-decisions:
  - "8-hour auto-expiry is safe because presence confirmation (Phase 6) catches inactive users within 30 minutes"
  - "5-minute cooldown balances anti-gaming with party re-entry convenience"

patterns-established:
  - "Threshold calibration via CREATE OR REPLACE — no schema changes, no new denial codes"

# Metrics
duration: 1min
completed: 2026-02-11
---

# Phase 7 Plan 1: Party Trust Calibration Summary

**Auto-expiry extended to 8h and cooldown reduced to 5min for party events, with full threshold reference documented**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-11T14:48:31Z
- **Completed:** 2026-02-11T14:50:12Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Extended auto-expiry from 4h to 8h to accommodate party-length events (safe with Phase 6 presence confirmation)
- Reduced cooldown from 15min to 5min for quick re-entry when stepping outside briefly
- Created comprehensive TRUST_THRESHOLDS.md documenting all 5 check-in trust parameters, denial codes, and future calibration notes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SQL migration adjusting auto-expiry and cooldown thresholds** - `9a5e273` (feat)
2. **Task 2: Create trust threshold reference documentation** - `508be80` (docs)

## Files Created/Modified

- `supabase/migrations/029_party_trust_calibration.sql` - CREATE OR REPLACE for auto_checkout_expired (8h) and check_in_to_place_v2 (5min cooldown)
- `.planning/TRUST_THRESHOLDS.md` - Reference doc with all trust parameters, denial codes, and future calibration guidance

## Decisions Made

- 8-hour auto-expiry chosen because presence confirmation (Phase 6) already catches inactive users every 30 minutes — the auto-expiry is a safety net, not the primary mechanism
- 5-minute cooldown is sufficient anti-abuse buffer based on the pattern that gaming requires rapid cycling, not single re-entries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 07 complete (single plan), ready for phase transition
- All trust thresholds documented for easy future calibration
- No client-side changes needed — existing denial messages in useCheckIn.ts remain valid

## Self-Check: PASSED

- FOUND: supabase/migrations/029_party_trust_calibration.sql
- FOUND: .planning/TRUST_THRESHOLDS.md
- FOUND: commit 9a5e273 (Task 1)
- FOUND: commit 508be80 (Task 2)

---
*Phase: 07-trust-calibration*
*Completed: 2026-02-11*
