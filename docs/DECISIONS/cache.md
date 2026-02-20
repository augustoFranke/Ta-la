# ADR: Cache

## Status
Accepted

## Date
2026-02-19

## Context
Venue API requests were expensive and frequent, while venue data is relatively stable.

## Decision
Adopt a 30-day venue cache with 2km geographic invalidation and recalculate visible distance client-side using Haversine.

## Consequences
- Major reduction in repeated Places API calls.
- Cached data can be stale if venue metadata changes quickly.
- Displayed distance remains current as user position changes.

## Evidence
- `.planning/phases/15-google-places-api-venue-ux/15-02-SUMMARY.md`
- `src/stores/venueStore.ts`
- `src/hooks/useVenues.ts`
- Git commits: `f541283`, `35caf34`

