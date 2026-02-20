# ADR: Interactions

## Status
Accepted

## Date
2026-02-19

## Context
The old drink-only flow was too narrow for low-friction signaling and matching.

## Decision
Unify signals in an `interactions` model (`drink`, `wave`, `like`) with any-combo mutual matching, `TEXT CHECK` constraints (not Postgres enums), and re-match support via `unmatched_at`.

## Consequences
- Single interaction pipeline simplifies UI and backend logic.
- Matching becomes flexible across signal types.
- Schema changes rely on check constraints and migration discipline.

## Evidence
- `.planning/phases/16-interaction-types-wave-like/16-01-SUMMARY.md`
- `supabase/migrations/032_create_interactions.sql`
- `supabase/migrations/033_send_interaction_rpc.sql`
- Git commits: `efcc8bb`, `ad88b01`

