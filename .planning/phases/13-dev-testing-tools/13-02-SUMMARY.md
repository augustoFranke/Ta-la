---
phase: 13-dev-testing-tools
plan: 02
subsystem: testing
tags: [expo, zustand, supabase, check-in, dev-tools, react-native]

# Dependency graph
requires:
  - phase: 13-dev-testing-tools
    plan: 01
    provides: Dev GPS override in locationStore (devOverride/devLat/devLng), dev-settings screen

provides:
  - Check-in distance bypass when devOverride is active (sends venue coords as user coords)
  - Simulated user insertion UI in dev-settings for roster testing
  - Active check-in venue_id display in dev-settings for easy copy
  - Cleanup button to remove all dev-test simulated users and their check-ins

affects: [check-in testing, venue roster testing, multi-user discovery]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "__DEV__ coordinate override in RPC call: send venue coords as user coords when devOverride active"
    - "Simulated user insertion via direct Supabase insert with dev-test email pattern for cleanup"

key-files:
  created: []
  modified:
    - src/hooks/useCheckIn.ts
    - app/(tabs)/profile/dev-settings.tsx

key-decisions:
  - "Send venue's own coords as user position when devOverride active — guarantees ST_DWithin passes at 0m, no server changes needed"
  - "Dev-test email pattern (dev-test-*@test.local) enables targeted cleanup without touching real user data"
  - "RLS errors surfaced with fallback hint pointing to Supabase SQL Editor"

patterns-established:
  - "Dev bypass in RPC calls: read devOverride from store inside __DEV__ block, override user coords with venue coords"

# Metrics
duration: ~2min
completed: 2026-02-12
---

# Phase 13 Plan 02: Check-in Bypass and Simulated User Insertion Summary

**Dev check-in bypass sends venue coords as user position when devOverride active (guarantees 100m pass), plus simulated user insertion UI for roster testing with cleanup in dev-settings screen**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-12T14:08:55Z
- **Completed:** 2026-02-12T14:10:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- useCheckIn now reads devOverride from locationStore inside a `__DEV__` block; when active, venue's own lat/lng are sent as user coordinates (distance = 0m, guaranteed pass) with accuracy = 5m
- Dev settings screen gains "Check-in Ativo" section showing selectable venue_id from active check-in, so developer can copy it without visiting Supabase Dashboard
- "Simular Usuário" section in dev-settings: insert fake user + check_in row directly via Supabase client, with RLS error handling and a cleanup button that deletes all `dev-test-*@test.local` users and their check-ins

## Task Commits

Each task was committed atomically:

1. **Task 1: Bypass distance check in useCheckIn when dev override is active** - `0472347` (feat)
2. **Task 2: Add simulated user insertion for roster testing** - `625ed22` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/hooks/useCheckIn.ts` - Added `__DEV__` block in `checkInToPlace`: reads `devOverride`, overrides `userLat`/`userLng`/`userAccuracy` with venue coords before RPC call
- `app/(tabs)/profile/dev-settings.tsx` - Added imports for supabase and useCheckInStore; added `simVenueId`/`simLoading` state; `handleSimulateUser` and `handleCleanupTestUsers` handlers; "Check-in Ativo" venue_id display section; "Simular Usuário" section with TextInput, simulate button, cleanup button; new styles `cleanupButton`, `buttonDisabled`

## Decisions Made

- **Send venue coords as user position:** The server's `check_in_to_place_v2` RPC checks `ST_DWithin(venue_location, user_location, 100)`. Sending the venue's own lat/lng makes distance = 0m, guaranteed pass. No server changes needed.
- **Dev-test email pattern:** `dev-test-${Date.now()}@test.local` enables bulk cleanup with a single `.like()` query without touching any real user data.
- **RLS error handling:** Direct Supabase insert may fail if insert policies are restrictive. Error surfaced with a hint to use the SQL Editor as fallback, rather than silently failing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Developer can now test full check-in flow on Expo Go at any simulated location without visiting venues physically
- Developer can simulate a second user at a venue and verify they appear in the venue roster
- Note: if direct user insert fails due to RLS, developer can use Supabase Dashboard SQL Editor to insert test user manually — error message in UI guides this
- All dev tooling (coordinate bypass, simulated users) is absent from production builds via `__DEV__` guards

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 13-dev-testing-tools*
*Completed: 2026-02-12*
