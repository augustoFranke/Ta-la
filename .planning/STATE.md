# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-16)

**Core value:** People can discover and connect with someone they've noticed at a venue or campus — without the fear of cold approach and rejection.
**Current focus:** v2.0 MVP Relaunch

## Current Position

**Milestone:** v2.0 MVP Relaunch
**Phase:** 15 — Google Places API Venue UX
**Plan:** 03 of N complete
**Status:** In progress

Progress: [____________________] 0% (0/6 phases complete)

Last activity: 2026-02-19 — Phase 15 Plan 03 complete: VenueCard rebuild with hero photo + check-in button states, CheckInModal replaced with lightweight bottom sheet

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
- [Phase 15-google-places-api-venue-ux]: Use full CREATE OR REPLACE FUNCTION body in proximity threshold migration (not ALTER) for self-contained, idempotent migration
| Phase 15-google-places-api-venue-ux P01 | 5 | 1 tasks | 1 files |
- [Phase 15-01]: Google Places API (New) replaces Foursquare; Field Masking excludes rating/openingHours for cost savings
| Phase 15-google-places-api-venue-ux P03 | 12 | 2 tasks | 4 files |
- [Phase 15-03]: Check-in always public — no visibility or open_to_meeting toggles

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

1. Phase 15 Plan 03 complete — VenueCard UX rebuild and CheckInModal simplification
2. VenueCard: hero photo top, name+distance below, full-width check-in button at bottom
3. Check-in button: 3 states based on 10m threshold and activeCheckInPlaceId
4. CheckInModal: slide-up bottom sheet, no toggles, onConfirm() always public check-in
5. VenueCarousel updated to pass new props; app/venue/[id].tsx updated for no-arg onConfirm

### What's Next

Continue Phase 15: Google Places API Venue UX
- Plan 04: (next plan)
