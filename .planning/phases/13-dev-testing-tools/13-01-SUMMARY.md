---
phase: 13-dev-testing-tools
plan: 01
subsystem: testing
tags: [expo, zustand, location, venues, dev-tools]

# Dependency graph
requires:
  - phase: 12-api-throttling
    provides: useVenues hook with hasFetchedRef guard and clearVenues action

provides:
  - Dev GPS coordinate override in locationStore (setDevOverride / clearDevOverride)
  - Dev settings screen at /(tabs)/profile/dev-settings
  - __DEV__-gated Dev Settings button on profile screen
  - Automatic venue list refresh when override is activated/deactivated

affects: [check-in testing, venue discovery, GPS-dependent features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "__DEV__ guard pattern for dev-only store actions"
    - "lastFetched=null as reset signal to re-arm hasFetchedRef in useVenues"

key-files:
  created:
    - app/(tabs)/profile/dev-settings.tsx
  modified:
    - src/stores/locationStore.ts
    - src/hooks/useVenues.ts
    - app/(tabs)/profile/_layout.tsx
    - app/(tabs)/profile/index.tsx

key-decisions:
  - "setDevOverride updates latitude/longitude in store directly so all consumers see new coords immediately"
  - "useVenues watches lastFetched===null to reset hasFetchedRef, enabling re-fetch without adding extra reactive deps"
  - "clearDevOverride calls getCurrentLocation() to restore real GPS coords after override is disabled"

patterns-established:
  - "Dev-only store actions wrapped in if (!__DEV__) return guards at the action level"
  - "Venue refresh chain: override change → clearVenues() → lastFetched=null → hasFetchedRef reset → auto-fetch retriggers"

# Metrics
duration: 2min
completed: 2026-02-12
---

# Phase 13 Plan 01: Dev GPS Override and Dev Settings Screen Summary

**Dev GPS coordinate override in locationStore with a dev settings screen allowing arbitrary lat/lng injection and automatic venue list refresh at overridden coordinates**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-12T14:04:21Z
- **Completed:** 2026-02-12T14:06:46Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- locationStore extended with devOverride/devLat/devLng state and setDevOverride/clearDevOverride actions (no-ops in production via `__DEV__` guards)
- Dev settings screen with lat/lng text inputs, activate/deactivate toggle, Dourados and São Paulo presets, and status indicator
- Venue list auto-refreshes when override is activated or deactivated (via lastFetched=null signal resetting hasFetchedRef)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add dev override state to locationStore and create dev settings screen** - `2fecaa3` (feat)
2. **Task 2: Wire GPS override to trigger venue list refresh** - `211b61b` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/stores/locationStore.ts` - Added devOverride/devLat/devLng state, setDevOverride (updates store lat/lng), clearDevOverride (restores real GPS), getCurrentLocation short-circuits when devOverride active
- `app/(tabs)/profile/dev-settings.tsx` - New screen with lat/lng inputs, toggle button, preset coords, status indicator; calls setDevOverride/clearDevOverride and clearVenues()
- `app/(tabs)/profile/_layout.tsx` - Added Stack.Screen for dev-settings route with headerShown: false
- `app/(tabs)/profile/index.tsx` - Added __DEV__-gated Dev Settings button between Settings section and Version text
- `src/hooks/useVenues.ts` - Added useEffect watching lastFetched — resets hasFetchedRef.current when lastFetched goes to null, allowing auto-fetch to re-trigger at new coords

## Decisions Made

- **setDevOverride updates latitude/longitude directly:** Ensures all consumers (useVenues, useCheckIn) see new coords immediately without extra plumbing.
- **lastFetched=null as reset signal:** Instead of exposing hasFetchedRef externally, watching lastFetched in useVenues to detect clearVenues() calls and re-arm the auto-fetch guard. Avoids adding reactive deps that could cause loops.
- **clearDevOverride calls getCurrentLocation():** Restores real GPS position without requiring the user to navigate away and back.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dev GPS override ready for testing check-in flows on Expo Go at arbitrary coordinates
- Activate Dourados or São Paulo preset from dev settings, navigate to home screen, venue list updates immediately
- Deactivating override restores real GPS and re-fetches venues
- All dev functionality stripped from production builds via __DEV__ guards

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 13-dev-testing-tools*
*Completed: 2026-02-12*
