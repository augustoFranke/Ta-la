# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-11)

**Core value:** People can reliably discover who is at the same venue right now, with trustworthy proximity-based check-in.
**Current focus:** v1.1 Party Prep — controlled party tests at partnered venues

## Current Position

Milestone: v1.1 Party Prep
Phase: 07-trust-calibration (Phase complete — 1/1 plans done)
Status: Executing phases
Last activity: 2026-02-11 - Completed 07-01 party trust calibration

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 1.5 min
- Total execution time: 0.35 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Check-in Trust Core | 2 | 3 min | 1.5 min |
| 2. Same-Venue Discovery | 2 | 3 min | 1.5 min |
| 3. Safety and Moderation Enforcement | 2 | 4 min | 2 min |
| 4. Offer and Notification Controls | 2 | 4 min | 2 min |
| 5. Tech Debt and Party Foundation | 1 | 3 min | 3 min |
| 6. Party Experience | 3 | 5 min | 1.7 min |
| 7. Trust Calibration | 1 | 1 min | 1 min |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

Key patterns established in v1.0:
- SECURITY DEFINER RPCs for trust boundaries (check-in, offers, notifications)
- Server-authoritative check-in — no client-side distance gating
- TEXT + CHECK constraint for enums (not Postgres ENUM type)
- Set<string> in Zustand for O(1) blocked-user lookups
- Opt-out notification model (all enabled by default)
- pt-BR error messages mapped client-side from server codes
- Deep link hydration: useLocalSearchParams + Supabase fetch when store is empty
- Optimistic toggle with error revert for is_available on profile screen
- Interval + AppState pattern for foreground-only periodic prompts (presence confirmation)
- Direct Supabase UPDATE for checkout (no RPC needed, RLS sufficient)
- [Phase 06]: Debounce realtime events at 300ms to prevent rapid-fire RPC calls
- [Phase 07]: Threshold calibration via CREATE OR REPLACE — no schema changes, no new denial codes
- [Phase 07]: 8h auto-expiry safe because presence confirmation (Phase 6) catches inactives within 30min

### Pending Todos

- Execute remaining v1.1 phases (7)

### Blockers/Concerns

- Fraud threshold calibration needs production telemetry or party test data

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed 07-01-PLAN.md
Resume file: None
