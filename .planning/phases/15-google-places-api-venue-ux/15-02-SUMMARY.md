---
phase: 15-google-places-api-venue-ux
plan: "02"
subsystem: venue-cache
tags: [cache, haversine, distance, venues, zustand]
dependency_graph:
  requires: []
  provides: [30-day venue cache, city-radius cache invalidation, client-side Haversine distance]
  affects: [src/stores/venueStore.ts, src/hooks/useVenues.ts]
tech_stack:
  added: []
  patterns: [Haversine formula for distance, Zustand derived state, useMemo for per-render recalculation]
key_files:
  created: []
  modified:
    - src/stores/venueStore.ts
    - src/hooks/useVenues.ts
decisions:
  - "30-day cache avoids expensive API re-fetches while still invalidating when user travels >2km"
  - "Distance recalculated client-side on every render so displayed distance reflects current GPS, not stale fetch position"
  - "Kept isVenueCacheValid for backward compatibility; isVenueCacheStale is the new canonical check"
metrics:
  duration: "~5 minutes"
  completed: "2026-02-19"
  tasks_completed: 2
  files_modified: 2
---

# Phase 15 Plan 02: 30-Day Venue Cache with City-Radius Invalidation and Client-Side Distance Summary

**One-liner:** 30-day aggressive venue cache with 2km city-radius invalidation and per-render Haversine distance recalculation from current GPS.

## What Was Built

### Task 1: venueStore 30-day cache + cachedLocation state

Updated `src/stores/venueStore.ts`:

- Changed `VENUE_CACHE_DURATION` from 5 minutes (`5 * 60 * 1000`) to 30 days (`30 * 24 * 60 * 60 * 1000`)
- Added `cachedLocation: { latitude: number; longitude: number } | null` to state
- Added `setCachedLocation` action
- Updated `clearVenues` to also reset `cachedLocation: null`
- Exported new `isVenueCacheStale` helper that checks both time expiry (30 days) AND geographic displacement (>2km from last fetch location using Haversine)

### Task 2: useVenues city-radius cache check + client-side distance

Updated `src/hooks/useVenues.ts`:

- Replaced `isVenueCacheValid` import/usage with `isVenueCacheStale`
- Added `setCachedLocation` destructure from store
- After successful fetch, calls `setCachedLocation({ latitude, longitude })` to record fetch position
- Added `useMemo` computing `venuesWithDistance` — recalculates each venue's distance from current GPS on every render using `calculateDistance` from `places.ts`
- Hook returns `venuesWithDistance` as `venues` so callers always see fresh distances

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| 30-day cache duration | Venue list is relatively static; aggressive caching reduces Google Places API costs significantly |
| 2km radius for invalidation | Detects city/neighborhood changes (travel) without invalidating for minor GPS drift |
| Distance recalculated on every render | User's GPS moves; stored distance from fetch time would diverge from reality |
| Venues remain in Google relevance order | Distance is a display value only; Google's relevance ranking is the primary sort signal |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `src/stores/venueStore.ts` modified with all required exports
- `src/hooks/useVenues.ts` modified with all required imports and logic
- Commits: f541283, 35caf34
- `npx tsc --noEmit` passes with no errors
