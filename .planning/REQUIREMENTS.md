# Requirements: Ta la!

**Defined:** 2026-02-11
**Core Value:** People can reliably discover who is at the same venue right now, with trustworthy proximity-based check-in.

## v1.2 Requirements (Complete)

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

## v1.3 Requirements (Complete)

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

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VENUE-01 | Phase 8 | Complete |
| VENUE-02 | Phase 8 | Complete |
| VENUE-03 | Phase 8 | Complete |
| VENUE-04 | Phase 8 | Complete |
| VENUE-05 | Phase 8 | Complete |
| VENUE-06 | Phase 8 | Complete |
| VENUE-07 | Phase 8 | Complete |
| HOME-01 | Phase 9 | Complete |
| HOME-02 | Phase 9 | Complete |
| HOME-03 | Phase 9 | Complete |
| HOME-04 | Phase 9 | Complete |
| UI-01 | Phase 10 | Complete |
| UI-02 | Phase 10 | Complete |
| PHOTO-01 | Phase 11 | Complete |
| PHOTO-02 | Phase 11 | Complete |
| PHOTO-03 | Phase 11 | Complete |
| DB-01 | Phase 10 | Complete |
| DB-02 | Deploy | Complete |

**Coverage:**
- v1.2 requirements: 11 total, 11 complete
- v1.3 requirements: 7 total, 7 complete
- Unmapped: 0

---
*Last updated: 2026-02-11 — v1.3 Production Ready shipped*
