---
phase: 01-check-in-trust-core
plan: 01
subsystem: database
tags: [plpgsql, postgis, st_dwithin, pg_cron, rpc, security-definer, geography]

# Dependency graph
requires:
  - phase: none
    provides: "First plan — depends on existing venues/check_ins tables and PostGIS extension"
provides:
  - "check_in_to_place_v2 RPC with server-side proximity, freshness, cooldown validation"
  - "auto_checkout_expired pg_cron schedule (every 5 minutes)"
  - "Structured JSONB denial reasons for client consumption"
affects: [01-02-PLAN, phase-2-discovery, phase-4-offers]

# Tech tracking
tech-stack:
  added: [pg_cron]
  patterns: [security-definer-rpc, server-side-trust-boundary, geography-distance-check, structured-jsonb-response]

key-files:
  created:
    - supabase/migrations/020_check_in_trust_rpc.sql
    - supabase/migrations/021_check_in_auto_expiry_cron.sql
  modified: []

key-decisions:
  - "Used SECURITY DEFINER to bypass RLS for trust boundary enforcement"
  - "COALESCE on photo_url/rating in venue upsert to avoid overwriting existing values with NULL"
  - "GRANT EXECUTE to authenticated role for Supabase client RPC access"

patterns-established:
  - "Server-authoritative validation: all check-in rules enforced in plpgsql, not client"
  - "Structured JSONB response: { success, check_in_id, denial_reason } for all RPC outcomes"
  - "Venue upsert on check-in: ensures venue exists before check-in without separate call"

# Metrics
duration: 1min
completed: 2026-02-10
---

# Phase 1 Plan 01: Server-side Check-in Trust RPC Summary

**Server-authoritative check_in_to_place_v2 RPC with ST_DWithin proximity (100m), 60s freshness, 15min cooldown validation, and pg_cron auto-expiry every 5 minutes**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-10T18:59:25Z
- **Completed:** 2026-02-10T19:00:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `check_in_to_place_v2` SECURITY DEFINER RPC that validates proximity (ST_DWithin 100m on geography), location freshness (60s), and venue cooldown (15min) server-side
- Enforces one-active-check-in by deactivating prior before inserting new
- Returns structured JSONB `{ success, check_in_id, denial_reason }` for all outcomes including `not_authenticated`, `stale_location`, `too_far`, `cooldown`
- Scheduled `auto_checkout_expired()` via pg_cron every 5 minutes to expire check-ins older than 4 hours

## Task Commits

Each task was committed atomically:

1. **Task 1: Create check_in_to_place_v2 server-authoritative RPC** - `317d8bb` (feat)
2. **Task 2: Schedule auto-expiry cron for stale check-ins** - `2b1275b` (feat)

## Files Created/Modified
- `supabase/migrations/020_check_in_trust_rpc.sql` - SECURITY DEFINER function with 13 params: auth check, freshness validation, venue upsert, ST_DWithin distance check, cooldown enforcement, prior check-in deactivation, new check-in creation
- `supabase/migrations/021_check_in_auto_expiry_cron.sql` - Enables pg_cron extension, schedules auto_checkout_expired() every 5 minutes

## Decisions Made
- Used SECURITY DEFINER to bypass RLS — intentional for server trust boundary (function validates auth.uid() internally)
- COALESCE on photo_url/rating in venue upsert to preserve existing non-null values when client sends NULL
- Granted EXECUTE to authenticated role so Supabase client can call via `.rpc('check_in_to_place_v2', ...)`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Server trust boundary complete, ready for Plan 02 (client integration with server trust boundary + pt-BR denial messages)
- Plan 02 will update the client service to call `check_in_to_place_v2` instead of direct inserts

## Self-Check: PASSED

All created files verified on disk. All commit hashes verified in git log.

---
*Phase: 01-check-in-trust-core*
*Completed: 2026-02-10*
