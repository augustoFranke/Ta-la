# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-12)

**Core value:** People can reliably discover who is at the same venue right now, with trustworthy proximity-based check-in.
**Current focus:** v1.4 API Optimization & Check-in Testing

## Current Position

**Milestone:** v1.4 API Optimization & Check-in Testing
**Phase:** 13 — Dev Testing Tools
**Plan:** 01 Complete
**Status:** Phase 13 Plan 01 complete

Progress: [████████████████████] 100% (2/2 phases complete)

Last activity: 2026-02-12 — Phase 13 dev GPS override complete

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

**v1.4 API Optimization & Check-in Testing** (In progress 2026-02-12)
- 2 phases (12-13), 2 plans
- Phase 12: API throttling (limit=3, photos capped, hasFetchedRef)
- Phase 13: Dev GPS override + dev settings screen

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
| setDevOverride updates latitude/longitude directly | Ensures all consumers see new coords immediately without extra plumbing | Phase 13 |
| lastFetched=null as reset signal for hasFetchedRef | Watching lastFetched in useVenues avoids exposing hasFetchedRef externally and adding loop-inducing deps | Phase 13 |

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
- __DEV__ guard pattern for dev-only store actions (no-ops in production)
- Venue refresh chain: override change → clearVenues() → lastFetched=null → hasFetchedRef reset → auto-fetch retriggers

### Technical Debt

None.

### Blockers

None.

### Open Questions

None.

## Session Continuity

### What Just Happened

1. Phase 13 Plan 01: Dev GPS Override complete — 2 tasks, 5 files changed
2. locationStore extended with devOverride/devLat/devLng, setDevOverride, clearDevOverride
3. Dev settings screen created with lat/lng inputs, presets, toggle, status indicator
4. Profile screen gets __DEV__-gated Dev Settings button
5. useVenues wired to re-fetch when clearVenues() resets lastFetched to null

### What's Next

v1.4 milestone complete. Ready for next milestone.

### Context for Next Session

- Dev GPS override accessible at /(tabs)/profile/dev-settings in __DEV__ builds
- Activate Dourados (-22.2233, -54.8083) or São Paulo (-23.5534, -46.6913) presets to test venue discovery
- Check-in RPC `check_in_to_place_v2` still validates 100m via PostGIS — dev bypass not yet added (future phase)
- All dev functionality stripped from production via __DEV__ guards at action level
