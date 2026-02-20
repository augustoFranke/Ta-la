# ADR: Realtime

## Status
Accepted

## Date
2026-02-19

## Context
Realtime events can arrive in bursts and event payloads may not represent final server-filtered state.

## Decision
Use Supabase Realtime events as invalidation signals only: debounce events and refetch canonical data via RPC instead of trusting payload contents.

## Consequences
- Better consistency with server-side filtering logic.
- Extra RPC calls after events.
- Lower risk of client drift from authoritative state.

## Evidence
- `.planning/phases/06-party-experience/06-03-SUMMARY.md`
- `src/hooks/useVenueRealtime.ts`
- Git commits: `d0fd6d6`, `e4ce447`

