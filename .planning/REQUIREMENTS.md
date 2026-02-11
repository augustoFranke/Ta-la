# Requirements: Tá lá! v1.2

**Defined:** 2026-02-11
**Core Value:** People can reliably discover who is at the same venue right now, with trustworthy proximity-based check-in.

## v1.2 Requirements

Requirements for v1.2 Venue Discovery milestone. Each maps to roadmap phases.

### Venue Filtering

- [x] **VENUE-01**: Remove nightlife score threshold filtering from venue transformation
- [x] **VENUE-02**: Add NIGHTLIFE_TYPES whitelist array with approved venue types
- [x] **VENUE-03**: Simplify isAllowedVenue() to use whitelist-only approach (no scoring)
- [x] **VENUE-04**: Include core nightlife types in whitelist (bar, pub, lounge, night_club, brewery)
- [x] **VENUE-05**: Include bar variants in whitelist (dive_bar, gastropub, speakeasy, tavern)
- [x] **VENUE-06**: Include entertainment venues in whitelist (karaoke, jazz_club, comedy_club, music_venue)
- [x] **VENUE-07**: Include restaurant type in whitelist (from Foursquare nightlife categories)

### Home Screen Polish

- [ ] **HOME-01**: Improve empty state messaging when no venues found (clear call-to-action)
- [ ] **HOME-02**: Add better error handling with retry functionality
- [ ] **HOME-03**: Polish loading states and transitions
- [ ] **HOME-04**: Improve location permission denial handling with clear prompts

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
- **HOME-FUTURE-03**: Add favorite venues feature
- **HOME-FUTURE-04**: Add venue photos carousel in cards

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Restore nightlife scoring for filtering | Too strict, caused legitimate venues to be filtered out |
| Add Google Places API | Foursquare already integrated and working, switching adds complexity |
| Custom venue submission | User-generated content requires moderation infrastructure |
| Venue reviews/ratings | Deferred until core discovery loop is validated |
| Venue event calendar | Out of MVP scope, focus on real-time presence |
| Advanced venue search | Basic discovery sufficient for v1.2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VENUE-01 | Phase 8 | Complete |
| VENUE-02 | Phase 8 | Complete |
| VENUE-03 | Phase 8 | Complete |
| VENUE-04 | Phase 8 | Complete |
| VENUE-05 | Phase 8 | Complete |
| VENUE-06 | Phase 8 | Complete |
| VENUE-07 | Phase 8 | Complete |
| HOME-01 | Phase 9 | Pending |
| HOME-02 | Phase 9 | Pending |
| HOME-03 | Phase 9 | Pending |
| HOME-04 | Phase 9 | Pending |

**Coverage:**
- v1.2 requirements: 11 total
- Mapped to phases: 11 ✓
- Unmapped: 0

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 after roadmap creation*
