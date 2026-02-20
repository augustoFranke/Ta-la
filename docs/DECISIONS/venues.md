# ADR: Venues

## Status
Accepted

## Date
2026-02-19

## Context
Venue discovery quality and cost profile needed improvement for the target region.

## Decision
Replace Foursquare venue discovery with Google Places API (New), using field masking and Google relevance ordering.

## Consequences
- Better venue coverage/quality for Brazil target usage.
- Lower API cost by excluding expensive fields (`rating`, `openingHours`).
- Distance display logic moves to client-side computation.

## Evidence
- `.planning/phases/15-google-places-api-venue-ux/15-01-SUMMARY.md`
- `src/services/places.ts`
- Git commit: `3f610c7`

