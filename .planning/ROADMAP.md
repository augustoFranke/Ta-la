# Roadmap: Ta la

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-10)
- ✅ **v1.1 Party Prep** — Phases 5-7 (shipped 2026-02-11)
- 🚧 **v1.2 Venue Discovery** — Phases 8-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-02-10</summary>

- [x] Phase 1: Check-in Trust Core (2/2 plans) — completed 2026-02-10
- [x] Phase 2: Same-Venue Discovery (2/2 plans) — completed 2026-02-10
- [x] Phase 3: Safety and Moderation Enforcement (2/2 plans) — completed 2026-02-10
- [x] Phase 4: Offer and Notification Controls (2/2 plans) — completed 2026-02-10

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### Phase 5: Tech Debt and Party Foundation

**Goal:** Clean up dead code causing LSP errors, add `is_available` column to users table, and implement deep linking so invite links route directly to venue screens.

**Requirements:** REQ-01, REQ-02, REQ-04 (DB only)

**Plans:** 1 plan

Plans:
- [x] 05-01-PLAN.md — Dead file cleanup, is_available type, deep linking — completed 2026-02-11

### Phase 6: Party Experience

**Goal:** Working party flow — availability toggle UI on profile, presence confirmation prompts, and realtime discovery updates for venue roster at party scale.

**Requirements:** REQ-03, REQ-04 (UI), REQ-05

**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — SQL migrations (is_available, realtime publication) + availability toggle UI — completed 2026-02-11
- [x] 06-02-PLAN.md — Presence confirmation hook/modal + checkout function — completed 2026-02-11
- [x] 06-03-PLAN.md — Realtime venue subscription + discover screen integration — completed 2026-02-11

### Phase 7: Trust Calibration

**Goal:** Review and document fraud threshold parameters for party context. Adjust check-in distance, freshness, and cooldown values for controlled party events.

**Requirements:** REQ-06

**Plans:** 1 plan

Plans:
- [x] 07-01-PLAN.md — Adjust auto-expiry and cooldown thresholds + document all trust parameters — completed 2026-02-11

---

## v1.2 Venue Discovery

**Started:** 2026-02-11
**Goal:** Fix venue discovery by removing nightlife score filtering and implementing whitelist-only approach. Polish home screen UX with better error handling, loading states, and empty state messaging.

### Phase 8: Venue Whitelist Filtering

**Goal:** Users can reliably discover nearby nightlife venues using whitelist-only filtering

**Dependencies:** None (fixes existing functionality)

**Requirements:** VENUE-01, VENUE-02, VENUE-03, VENUE-04, VENUE-05, VENUE-06, VENUE-07

**Success Criteria:**
1. User sees bars, pubs, and lounges on home screen (previously filtered out)
2. User sees breweries, dive bars, and gastropubs in venue list
3. User sees entertainment venues (karaoke, jazz clubs, music venues) when nearby
4. User sees restaurants categorized as nightlife venues
5. No venues are filtered out based on nightlife scores

**Files Changed:**
- `src/services/places.ts` (remove scoring logic, add whitelist, simplify filtering)

**Plans:** 1 plan

Plans:
- [x] 08-01-PLAN.md — Add whitelist, remove scoring threshold, simplify filtering — completed 2026-02-11

### Phase 9: Home Screen Polish

**Goal:** Users receive clear feedback when venue discovery encounters issues

**Dependencies:** Phase 8 (whitelist filtering must work first)

**Requirements:** HOME-01, HOME-02, HOME-03, HOME-04

**Success Criteria:**
1. User sees helpful empty state with clear action when no venues found
2. User can retry when location or API errors occur
3. User experiences smooth loading transitions when browsing venues
4. User receives clear prompts when location permissions are denied

**Files Changed:**
- `app/(tabs)/index.tsx` (empty states, error handling, loading UI, permission prompts)

**Plans:** 0 plans

Plans:
- [ ] TBD — Pending plan-phase execution

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
| 9. Home Screen Polish | v1.2 | 0/0 | Pending | — |
