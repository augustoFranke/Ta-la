---
phase: 03-safety-and-moderation-enforcement
plan: 01
subsystem: database
tags: [sql, indexes, typescript, blocks, reports, moderation]

requires:
  - phase: 01-check-in-trust-core
    provides: "Base blocks/reports tables from migration 010"
provides:
  - "idx_blocks_blocked index for bidirectional block lookups"
  - "UNIQUE constraint on reports(reporter_id, reported_id)"
  - "ReportReason type and REPORT_REASONS constant for UI"
  - "Block and Report TypeScript interfaces"
affects: [03-02, safety-service-layer]

tech-stack:
  added: []
  patterns:
    - "Union type mirroring DB CHECK constraint values"
    - "Labeled constant array for enum-like UI rendering"

key-files:
  created:
    - supabase/migrations/024_block_report_indexes.sql
  modified:
    - src/types/database.ts

key-decisions:
  - "Constraint name reports_reporter_reported_unique for clarity"
  - "REPORT_REASONS as readonly array with pt-BR labels for direct UI consumption"

patterns-established:
  - "DB CHECK constraint values mirrored as TypeScript union types"
  - "Labeled constant arrays for enum-to-UI rendering pattern"

duration: 1min
completed: 2026-02-10
---

# Phase 3 Plan 1: Block/Report Index & Types Summary

**Missing blocked_id index, reports UNIQUE constraint, and TypeScript types for ReportReason/Block/Report added**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-10T19:47:13Z
- **Completed:** 2026-02-10T19:48:11Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `idx_blocks_blocked` index on `blocks.blocked_id` for bidirectional block lookups (fixes sequential scan in `get_users_at_venue` RPC)
- Added `reports_reporter_reported_unique` UNIQUE constraint preventing duplicate reports per user pair
- Added `ReportReason` union type and `REPORT_REASONS` labeled constant for UI rendering
- Added `Block` and `Report` TypeScript interfaces matching DB schema

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration for missing blocked_id index and reports UNIQUE constraint** - `c68f26d` (feat)
2. **Task 2: Add ReportReason type, REPORT_REASONS constant, and Block/Report row types to database.ts** - `eed886a` (feat)

## Files Created/Modified
- `supabase/migrations/024_block_report_indexes.sql` - Index on blocks.blocked_id and UNIQUE constraint on reports(reporter_id, reported_id)
- `src/types/database.ts` - ReportReason type, REPORT_REASONS constant, Block and Report interfaces

## Decisions Made
- Constraint named `reports_reporter_reported_unique` for clarity and consistency
- `REPORT_REASONS` as readonly array with pt-BR labels for direct UI consumption in report forms

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Types and DB constraints ready for Plan 03-02 (block/report service layer)
- `ReportReason` and `REPORT_REASONS` available for import in service and UI code

## Self-Check: PASSED

All files exist, all commits verified, all content checks passed.

---
*Phase: 03-safety-and-moderation-enforcement*
*Completed: 2026-02-10*
