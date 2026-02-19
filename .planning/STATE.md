# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-16)

**Core value:** People can discover and connect with someone they've noticed at a venue or campus — without the fear of cold approach and rejection.
**Current focus:** v2.0 MVP Relaunch

## Current Position

**Milestone:** v2.0 MVP Relaunch
**Phase:** 16 — Interaction Types (Wave & Like)
**Plan:** 01 of 04 complete
**Status:** In Progress

Progress: [█___________________] 5% (0/6 phases complete)

Last activity: 2026-02-19 — Phase 16 Plan 01 complete: interactions table, match trigger v2, send/get interaction RPCs, unmatch support

## Performance Metrics

### Historical Performance

**v1.0 MVP** (Shipped 2026-02-10)
- 4 phases, 8 plans, 18 feat commits
- 28 files changed, 2,400 insertions, 297 deletions

**v1.1 Party Prep** (Shipped 2026-02-11)
- 3 phases (5-7), 5 plans

**v1.2 Venue Discovery** (Shipped 2026-02-11)
- 2 phases (8-9), 2 plans

**v1.3 Production Ready** (Shipped 2026-02-11)
- 2 phases (10-11), 2 commits

**v1.4 API Optimization & Check-in Testing** (Shipped 2026-02-12)
- 2 phases (12-13), 2 plans

## Accumulated Context

### Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Preserve venues cache on logout | Venue list is not user-specific; clearing forces expensive re-fetch on next login | Phase 14 |
| Use .getState() for store calls in signOut | signOut is a regular async function, not a React component | Phase 14 |
| Google Places API (New) | Pivot from Foursquare for better data quality in Brazil; optimized for cost | v2.0 planning |
| Chat in MVP | Core to hookup use case — match without chat is dead end | v2.0 planning |
| 4-tab nav | Dedicated Chat tab improves engagement and accessibility | v2.0 planning |
| Remove venue detail page | Reduces friction to check-in; venue info is secondary to people | v2.0 planning |
| 10m check-in radius | Tighter proximity = higher trust that person is actually there | v2.0 planning |
| Haversine Formula | Avoid Google Distance Matrix API costs by calculating distance locally | v2.0 planning |
| 3 interaction types | Options without friction; wave/like are lower commitment than drink | v2.0 planning |
| TEXT CHECK for interaction_type | Consistent with project pattern; avoids Postgres ENUM | Phase 16 |
| ON CONFLICT clears unmatched_at | Enables re-matching after unmatch without deleting match row | Phase 16 |

Key patterns established (from v1.x):
- SECURITY DEFINER RPCs for trust boundaries (check-in, offers, notifications)
- Server-authoritative check-in — no client-side distance gating
- TEXT + CHECK constraint for enums (not Postgres ENUM type)
- Set<string> in Zustand for O(1) blocked-user lookups
- Opt-out notification model (all enabled by default)
- pt-BR error messages mapped client-side from server codes
- Deep link hydration: useLocalSearchParams + Supabase fetch when store is empty
- Google Places API (New) with Field Masking and aggressive caching
- __DEV__ guard pattern for dev-only store actions (no-ops in production)
- [Phase 14]: Suppress discover.tsx with href: null — Expo Router auto-discovers all files; href: null hides tab without deleting file
- [Phase 15]: Use full CREATE OR REPLACE FUNCTION body in proximity threshold migration (not ALTER) for self-contained, idempotent migration
- [Phase 16-01]: ANY-combo matching — trigger checks reverse interaction without type filter
- [Phase 16-01]: is_match in RPC response — query matches after trigger fires in same transaction

### Technical Debt

- 3 dead code functions to remove (Phase 14)
- Stores not reset on logout (Phase 14)
- 25+ hardcoded colors not using theme tokens (tracked, not blocking)
- Database types incomplete (only `users` modeled in `src/types/database.ts`)

### Blockers

None.

### Open Questions

None.

## Session Continuity

### What Just Happened

1. Phase 16 Plan 01 executed — database foundation for interactions system
2. Created interactions table, match trigger v2, send_interaction RPC, get_received_interactions RPC
3. Added unmatch support via unmatched_at column on matches

### What's Next

Phase 16 Plan 02: Service layer and TypeScript types for interactions
- Resume file: .planning/phases/16-interaction-types-wave-like/16-02-PLAN.md
