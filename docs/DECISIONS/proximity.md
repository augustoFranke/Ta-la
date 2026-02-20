# ADR: Proximity

## Status
Accepted

## Date
2026-02-19

## Context
The previous 100m check-in radius allowed check-ins from outside real venue presence.

## Decision
Reduce server check-in proximity from 100m to 10m in `check_in_to_place_v2`.

## Consequences
- Higher trust that users are physically present.
- More false negatives in weak-GPS environments.
- Dev/testing flows rely more on GPS override tools.

## Evidence
- `.planning/phases/15-google-places-api-venue-ux/15-05-SUMMARY.md`
- `supabase/migrations/20260219_update_checkin_proximity_threshold.sql`
- Git commit: `19b7e11`

