# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-12)

**Core value:** People can reliably discover who is at the same venue right now, with trustworthy proximity-based check-in.
**Current focus:** v1.4 API Optimization & Check-in Testing

## Current Position

**Milestone:** v1.4 API Optimization & Check-in Testing
**Phase:** 12 — API Throttling
**Plan:** 01 Complete
**Status:** Phase complete — ready for Phase 13

Progress: [██████████░░░░░░░░░░] 50% (1/2 phases complete)

Last activity: 2026-02-12 — Phase 12 API throttling complete

## Performance Metrics

### Historical Performance

**v1.0 MVP** (Shipped 2026-02-10)
- 4 phases, 8 plans, 18 feat commits
- 28 files changed, 2,400 insertions, 297 deletions

**v1.1 Party Prep** (Shipped 2026-02-11)
- 3 phases (5-7), 5 plans
- Deep link party invite, presence confirmation, availability toggle, realtime discovery, tech debt cleanup

**v1.2 Venue Discovery** (Shipped 2026-02-11)
- 2 phases (8-9), 2 plans
- Whitelist filtering, home screen polish

**v1.3 Production Ready** (Shipped 2026-02-11)
- 2 phases (10-11), 2 commits
- UI cleanup, venue photos, favorites migration, all migrations deployed

## Accumulated Context

### Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| Remove nightlife scoring filter | Too strict — bars scored 35 rejected by 40 threshold | Phase 8 |
| Use whitelist-only approach | Simpler, more maintainable, no false negatives | Phase 8 |
| Add `fields` param to Foursquare search | Photos is "Rich Data", not returned by default | Phase 11 |
| Support both fsq_id and fsq_place_id | v3 API may return either field name | Phase 11 |
| Support both geocodes.main and top-level lat/lng | Backward compatibility with both API response formats | Phase 11 |
| DROP FUNCTION before replacing return type | PostgreSQL limitation — cannot change return type in-place | Deploy fix |
| Read lastFetched/venues.length via getState() in useCallback | Avoids stale closures without adding reactive deps that cause re-fetch loops | Phase 12 |
| Use hasFetchedRef to guard auto-fetch effect | Simpler and immune to state timing vs. venues.length === 0 condition | Phase 12 |

Key patterns established:
- SECURITY DEFINER RPCs for trust boundaries (check-in, offers, notifications)
- Server-authoritative check-in — no client-side distance gating
- TEXT + CHECK constraint for enums (not Postgres ENUM type)
- Set<string> in Zustand for O(1) blocked-user lookups
- Opt-out notification model (all enabled by default)
- pt-BR error messages mapped client-side from server codes
- Deep link hydration: useLocalSearchParams + Supabase fetch when store is empty
- Foursquare v3 API with explicit `fields` param for rich data (photos, rating, hours)
- Merge + dedup pattern for combining store photos with API-fetched photos

### Technical Debt

- No dev testing tools for check-in flow — targeted in Phase 13

### Blockers

None.

### Open Questions

None.

## Session Continuity

### What Just Happened

1. Phase 12: API Throttling complete — 2 tasks, 3 files changed
2. Foursquare search throttled: limit=50 → limit=3 (API-01)
3. Photos capped at 1 per venue via slice(0, 1) (API-02)
4. fetchPlacePhotos removed from venue detail — uses cached photos only (API-03)
5. hasFetchedRef guards useVenues auto-fetch against re-trigger loops (API-04)

### What's Next

Execute Phase 13: Dev Testing Tools.

### Context for Next Session

- Check-in RPC `check_in_to_place_v2` validates 100m via PostGIS ST_DWithin — Phase 13 adds bypass for __DEV__
- Location store in `src/stores/locationStore.ts` — Phase 13 adds dev coordinate override here
- No existing test utilities, mock data, or dev tools — Phase 13 creates them from scratch
