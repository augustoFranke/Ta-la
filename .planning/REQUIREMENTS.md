# Requirements: Ta la!

**Defined:** 2026-02-12
**Core Value:** People can reliably discover who is at the same venue right now, with trustworthy proximity-based check-in.

## v1.4 Requirements

### API Throttling

- [ ] **API-01**: Venue search returns at most 3 venues closest to user (change `limit=50` to `limit=3`)
- [ ] **API-02**: Each venue in search results includes at most 1 photo from the search response
- [ ] **API-03**: Venue detail screen uses cached photo from search instead of making a separate `fetchPlacePhotos()` API call
- [ ] **API-04**: No redundant venue search requests — cache is respected, no re-fetch loops triggered by React effect dependencies

### Dev Testing

- [ ] **DEV-01**: Developer can override GPS coordinates via a dev settings screen accessible from profile (latitude/longitude input)
- [ ] **DEV-02**: Developer can check in at any venue regardless of distance when dev mode is active (bypass 100m server-side check)
- [ ] **DEV-03**: Developer can simulate a second user at the same venue to test roster visibility (via Supabase SQL insert or dev RPC)
- [ ] **DEV-04**: All dev testing tools are gated behind `__DEV__` flag and excluded from production builds

## Previous Requirements (Complete)

<details>
<summary>v1.2 Requirements — Complete</summary>

### Venue Filtering

- [x] **VENUE-01**: Remove nightlife score threshold filtering from venue transformation
- [x] **VENUE-02**: Add NIGHTLIFE_TYPES whitelist array with approved venue types
- [x] **VENUE-03**: Simplify isAllowedVenue() to use whitelist-only approach (no scoring)
- [x] **VENUE-04**: Include core nightlife types in whitelist (bar, pub, lounge, night_club, brewery)
- [x] **VENUE-05**: Include bar variants in whitelist (dive_bar, gastropub, speakeasy, tavern)
- [x] **VENUE-06**: Include entertainment venues in whitelist (karaoke, jazz_club, comedy_club, music_venue)
- [x] **VENUE-07**: Include restaurant type in whitelist (from Foursquare nightlife categories)

### Home Screen Polish

- [x] **HOME-01**: Improve empty state messaging when no venues found (clear call-to-action)
- [x] **HOME-02**: Add better error handling with retry functionality
- [x] **HOME-03**: Polish loading states and transitions
- [x] **HOME-04**: Improve location permission denial handling with clear prompts

</details>

<details>
<summary>v1.3 Requirements — Complete</summary>

### UI Cleanup

- [x] **UI-01**: Remove mini calendar / day pills from home screen
- [x] **UI-02**: Remove "Descubra o que rola por perto" subtitle text

### Photos

- [x] **PHOTO-01**: Add `fields` param to Place Search to include `photos` in API response
- [x] **PHOTO-02**: Add `fetchPlacePhotos(fsq_id)` service function for venue detail
- [x] **PHOTO-03**: Integrate photo fetching on venue detail screen with merge/dedup

### Database

- [x] **DB-01**: Create migration `030_create_user_favorite_places.sql` with RLS policies
- [x] **DB-02**: Deploy all pending migrations (020-030) via `supabase db push`

</details>

## Future Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Venue Discovery Enhancements

- **VENUE-FUTURE-01**: Add distance-based sorting with user preference
- **VENUE-FUTURE-02**: Add venue type filtering UI (show only bars, only clubs, etc.)
- **VENUE-FUTURE-03**: Add "open now" filter toggle
- **VENUE-FUTURE-04**: Cache venue data with smart refresh strategy

### Home Screen Features

- **HOME-FUTURE-01**: Add search/filter for venues by name
- **HOME-FUTURE-02**: Add map view toggle for venue browsing

### Social Features (Deferred)

- **EXPLORE-FUTURE-01**: Explorar tab with category filtering and map-style browsing
- **PARTNER-FUTURE-01**: Parceiros placeholder tab
- **FAV-FUTURE-01**: User favorites list accessible from profile

## Out of Scope

- In-app chat/messaging — explicitly excluded
- Venue vibes/dating score — deferred until core loop is stable
- Always-on background location tracking — conflicts with privacy-first explicit check-in model
- Public global map of all users — high safety/privacy risk
- friends_only visibility filtering — deferred

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 12 | Pending |
| API-02 | Phase 12 | Pending |
| API-03 | Phase 12 | Pending |
| API-04 | Phase 12 | Pending |
| DEV-01 | Phase 13 | Pending |
| DEV-02 | Phase 13 | Pending |
| DEV-03 | Phase 13 | Pending |
| DEV-04 | Phase 13 | Pending |

**Coverage:**
- v1.4 requirements: 8 total, 0 complete
- Mapped: 8/8 (100%)

---
*Last updated: 2026-02-12 — v1.4 roadmap created, phases 12-13 assigned*
