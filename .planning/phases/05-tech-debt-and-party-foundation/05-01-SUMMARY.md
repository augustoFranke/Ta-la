---
phase: 05-tech-debt-and-party-foundation
plan: 01
subsystem: infra, database, navigation
tags: [deep-linking, expo-router, supabase, tech-debt, availability]

# Dependency graph
requires:
  - phase: 04-offer-and-notification-controls
    provides: drinks service with send_drink_offer_v2 RPC
provides:
  - Dead code cleanup (6 deleted files properly removed from git)
  - is_available boolean on User type for availability toggling
  - receiver_unavailable error handling in drink offers
  - tala://venue/{place_id} deep linking on venue screen
affects: [06-ui-availability, party-invite-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deep link hydration: useLocalSearchParams + Supabase fetch when store is empty"
    - "DB-to-client mapping: google_place_id -> place_id for VenueWithDistance"

key-files:
  created: []
  modified:
    - src/types/database.ts
    - src/services/drinks.ts
    - src/hooks/useAuth.ts
    - app/venue/[id].tsx

key-decisions:
  - "Map distance to 0 for deep-linked venues (unknown user location)"
  - "Use google_place_id as the deep link param since it matches DB column"

patterns-established:
  - "Deep link pattern: useLocalSearchParams -> check store -> fetch from DB -> populate store"

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 5 Plan 1: Tech Debt Cleanup and Deep Linking Summary

**Removed 6 dead files from git, added is_available to User type, and implemented tala://venue/{place_id} deep linking via Expo Router params + Supabase fetch**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T14:00:20Z
- **Completed:** 2026-02-11T14:03:28Z
- **Tasks:** 2 auto + 1 soft checkpoint
- **Files modified:** 5

## Accomplishments
- Removed 6 dead-but-tracked files from git index (venueFlags, venueDetails, venueScoring, VenueDetailsModal, VenueReportModal, VenueVibeSelector) eliminating ~2000 lines of dead code
- Added `is_available` boolean to User type across Row, Insert, Update, and domain interface
- Added `receiver_unavailable` error code to DRINK_ERROR_MESSAGES for server-side availability checks
- Implemented venue deep linking: `tala://venue/{place_id}` fetches venue from Supabase when store is empty

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove dead files and add is_available to User type** - `b914174` (chore)
2. **Task 2: Implement deep linking for venue screen** - `47fdb1e` (feat)

## Files Created/Modified
- `src/types/database.ts` - Added is_available boolean to User Row/Insert/Update/domain types
- `src/services/drinks.ts` - Added receiver_unavailable error message and RPC comment
- `src/hooks/useAuth.ts` - Added is_available to MOCK_USER
- `app/venue/[id].tsx` - Deep link support with useLocalSearchParams, Supabase fetch, loading state

## Decisions Made
- Map `distance: 0` for deep-linked venues since user location relative to venue is unknown
- Use `google_place_id` as the deep link path parameter since Expo Router maps `[id]` directly
- Show pt-BR error messages: "Local nao encontrado" / "Carregando local..."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed MOCK_USER missing is_available field**
- **Found during:** Task 1 (after adding is_available to User type)
- **Issue:** TypeScript error TS2741 — MOCK_USER in useAuth.ts didn't include the new is_available field
- **Fix:** Added `is_available: true` to MOCK_USER
- **Files modified:** src/hooks/useAuth.ts
- **Verification:** npx tsc --noEmit passes
- **Committed in:** b914174 (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary fix for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

**Note:** The `is_available` column SQL migration and RPC update must be run separately in the Supabase SQL editor:
```sql
ALTER TABLE users ADD COLUMN is_available BOOLEAN DEFAULT true NOT NULL;
```
And update `send_drink_offer_v2` to check `is_available` before allowing offer.

## Next Phase Readiness
- Deep linking foundation ready for party invite flow
- is_available type ready for Phase 6 UI availability toggle
- Codebase clean of dead file references

---
*Phase: 05-tech-debt-and-party-foundation*
*Completed: 2026-02-11*

## Self-Check: PASSED
