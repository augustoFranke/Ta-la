# ADR: Trust Boundary

## Status
Accepted

## Date
2026-02-19

## Context
Check-in and interaction flows are abuse-sensitive and cannot trust client-side validation.

## Decision
Enforce trust-critical rules server-side using Supabase `SECURITY DEFINER` RPCs, with clients calling RPCs instead of writing trust-sensitive tables directly.

## Consequences
- Validation logic is centralized and consistent across all clients.
- Rule changes require SQL migrations and versioned rollout.
- Client UX maps server denial codes instead of duplicating validation rules.

## Evidence
- `.planning/phases/01-check-in-trust-core/01-01-SUMMARY.md`
- `supabase/migrations/020_check_in_trust_rpc.sql`
- `src/hooks/useCheckIn.ts`

