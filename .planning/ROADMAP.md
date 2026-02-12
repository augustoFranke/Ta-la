# Roadmap: Ta la

## Milestones

- **v1.0 MVP** — Phases 1-4 (shipped 2026-02-10)
- **v1.1 Party Prep** — Phases 5-7 (shipped 2026-02-11)
- **v1.2 Venue Discovery** — Phases 8-9 (shipped 2026-02-11)
- **v1.3 Production Ready** — Phases 10-11 (shipped 2026-02-11)
- **v1.4 API Optimization & Check-in Testing** — Phases 12-13 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) — SHIPPED 2026-02-10</summary>

- [x] Phase 1: Check-in Trust Core (2/2 plans) — completed 2026-02-10
- [x] Phase 2: Same-Venue Discovery (2/2 plans) — completed 2026-02-10
- [x] Phase 3: Safety and Moderation Enforcement (2/2 plans) — completed 2026-02-10
- [x] Phase 4: Offer and Notification Controls (2/2 plans) — completed 2026-02-10

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>v1.1 Party Prep (Phases 5-7) — SHIPPED 2026-02-11</summary>

- [x] Phase 5: Tech Debt and Party Foundation (1/1 plans) — completed 2026-02-11
- [x] Phase 6: Party Experience (3/3 plans) — completed 2026-02-11
- [x] Phase 7: Trust Calibration (1/1 plans) — completed 2026-02-11

</details>

<details>
<summary>v1.2 Venue Discovery (Phases 8-9) — SHIPPED 2026-02-11</summary>

- [x] Phase 8: Venue Whitelist Filtering (1/1 plans) — completed 2026-02-11
- [x] Phase 9: Home Screen Polish (1/1 plans) — completed 2026-02-11

</details>

<details>
<summary>v1.3 Production Ready (Phases 10-11) — SHIPPED 2026-02-11</summary>

- [x] Phase 10: UI Cleanup & Favorites Migration (1/1 plans) — completed 2026-02-11
- [x] Phase 11: Venue Photos (1/1 plans) — completed 2026-02-11

</details>

---

## v1.4 API Optimization & Check-in Testing

**Started:** 2026-02-12
**Goal:** Drastically reduce Foursquare API usage and enable local check-in testing on Expo Go.

### Phase 12: API Throttling

**Goal:** Foursquare API usage is minimized — search returns 3 venues, photos come from search cache, no redundant fetches.

**Dependencies:** None (self-contained service layer changes)

**Requirements:** API-01, API-02, API-03, API-04

**Plans:** 1 plan

Plans:
- [ ] 12-01-PLAN.md — Throttle search, cap photos, eliminate redundant fetches

**Success Criteria:**
1. Opening the home screen triggers at most one Foursquare API call per 5-minute cache window
2. Search response contains at most 3 venues and each venue has at most 1 photo
3. Opening a venue detail screen makes zero additional Foursquare photo API calls — the photo shown comes from the search cache
4. Navigating back and forth between home and venue detail does not re-trigger venue search

### Phase 13: Dev Testing Tools

**Goal:** Developer can override GPS location and bypass distance checks to test check-in flow end-to-end on Expo Go without physically visiting a venue.

**Dependencies:** Phase 12 (stable venue fetch behavior before adding dev overrides)

**Requirements:** DEV-01, DEV-02, DEV-03, DEV-04

**Success Criteria:**
1. A dev settings screen is accessible from the profile tab (visible only when `__DEV__` is true)
2. Entering custom latitude/longitude in dev settings causes the venue list to refresh with venues near those coordinates
3. Developer can tap check-in on any venue from the dev-overridden list and the check-in succeeds regardless of real GPS distance
4. Developer can insert a simulated second user at the same venue and see that user appear in the venue roster
5. The dev settings screen and all bypass logic are absent from production builds (`__DEV__` guard confirmed)

Plans:
- [ ] Dev settings screen + GPS override + check-in bypass + roster simulation

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Check-in Trust Core | v1.0 | 2/2 | Complete | 2026-02-10 |
| 2. Same-Venue Discovery | v1.0 | 2/2 | Complete | 2026-02-10 |
| 3. Safety and Moderation Enforcement | v1.0 | 2/2 | Complete | 2026-02-10 |
| 4. Offer and Notification Controls | v1.0 | 2/2 | Complete | 2026-02-10 |
| 5. Tech Debt and Party Foundation | v1.1 | 1/1 | Complete | 2026-02-11 |
| 6. Party Experience | v1.1 | 3/3 | Complete | 2026-02-11 |
| 7. Trust Calibration | v1.1 | 1/1 | Complete | 2026-02-11 |
| 8. Venue Whitelist Filtering | v1.2 | 1/1 | Complete | 2026-02-11 |
| 9. Home Screen Polish | v1.2 | 1/1 | Complete | 2026-02-11 |
| 10. UI Cleanup & Favorites Migration | v1.3 | 1/1 | Complete | 2026-02-11 |
| 11. Venue Photos | v1.3 | 1/1 | Complete | 2026-02-11 |
| 12. API Throttling | v1.4 | 0/1 | Pending | — |
| 13. Dev Testing Tools | v1.4 | 0/1 | Pending | — |
