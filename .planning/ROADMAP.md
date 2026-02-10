# Roadmap: Ta la

## Overview

This roadmap delivers the v1 trust loop in dependency order: trustworthy check-in first, then discoverability, then safety enforcement, then offer and notification value. The phase structure is derived directly from v1 requirement clusters and keeps scope aligned to MVP guardrails. Each phase ends with observable user outcomes so execution can be verified without relying on implementation details.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Check-in Trust Core** - Users can establish trusted presence at a venue under server-enforced rules.
- [x] **Phase 2: Same-Venue Discovery** - Users can see who is currently at the same venue and control their own visibility.
- [x] **Phase 3: Safety and Moderation Enforcement** - Users can block/report others and discovery excludes blocked users.
- [ ] **Phase 4: Offer and Notification Controls** - Users can unlock offers from valid presence and control notification categories.

## Phase Details

### Phase 1: Check-in Trust Core
**Goal**: Users can create and maintain a valid check-in state that reflects real venue proximity and expires reliably.
**Depends on**: Nothing (first phase)
**Requirements**: CHKN-01, CHKN-02, CHKN-03
**Success Criteria** (what must be TRUE):
  1. User can check in only when they are physically within the configured venue distance threshold.
  2. User receives a specific denial message when check-in is refused (distance, stale location, cooldown, or suspicious movement).
  3. User can have only one active check-in at a time and prior/expired presence is no longer treated as active.
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Server-side check-in trust RPC (proximity, freshness, cooldown) + auto-expiry cron
- [x] 01-02-PLAN.md — Client integration with server trust boundary + pt-BR denial messages

### Phase 2: Same-Venue Discovery
**Goal**: Users can reliably discover who is currently at the same venue, with clear recency and visibility control.
**Depends on**: Phase 1
**Requirements**: DISC-01, DISC-02
**Success Criteria** (what must be TRUE):
  1. User can open a venue roster that shows people currently checked in at that venue.
  2. User can see freshness/recency indicators that distinguish current presence from stale presence.
  3. User can set visibility mode per check-in (public at venue, friends-only, or private).
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md — Server-side visibility column + updated RPCs (recency data + visibility filter)
- [x] 02-02-PLAN.md — Client visibility selector in check-in modal + recency indicators on discover screen

### Phase 3: Safety and Moderation Enforcement
**Goal**: Users can protect themselves in discovery contexts and blocked relationships are enforced in visible surfaces.
**Depends on**: Phase 2
**Requirements**: SAFE-01, SAFE-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. User can block another user directly from profile and venue roster surfaces.
  2. User can submit a report with predefined reason and optional note from discovery/profile contexts.
  3. User never sees blocked users in discovery or venue roster views after block state applies.
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Backend: missing blocked_id index, reports UNIQUE constraint, TypeScript types
- [x] 03-02-PLAN.md — Frontend: moderation service, block store, block/report UI on profile + discover screens

### Phase 4: Offer and Notification Controls
**Goal**: Users can access venue offer value only from valid presence and control which notification categories they receive.
**Depends on**: Phase 1
**Requirements**: OFFR-01, OFFR-02, NOTF-01, NOTF-02
**Success Criteria** (what must be TRUE):
  1. User can unlock drink offers only when they have a valid active check-in.
  2. User can see clear offer state transitions (available, unlocked, expired, unavailable).
  3. User can configure social and offer notification preferences independently.
  4. User receives notifications only for categories currently enabled in preferences.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Check-in Trust Core | 2/2 | Complete | 2026-02-10 |
| 2. Same-Venue Discovery | 2/2 | Complete | 2026-02-10 |
| 3. Safety and Moderation Enforcement | 2/2 | Complete | 2026-02-10 |
| 4. Offer and Notification Controls | 0/TBD | Not started | - |

## Requirement Coverage

| Requirement | Phase |
|-------------|-------|
| CHKN-01 | Phase 1 |
| CHKN-02 | Phase 1 |
| CHKN-03 | Phase 1 |
| DISC-01 | Phase 2 |
| DISC-02 | Phase 2 |
| DISC-03 | Phase 3 |
| SAFE-01 | Phase 3 |
| SAFE-02 | Phase 3 |
| OFFR-01 | Phase 4 |
| OFFR-02 | Phase 4 |
| NOTF-01 | Phase 4 |
| NOTF-02 | Phase 4 |

Coverage check: 12/12 v1 requirements mapped, no orphans, no duplicates.
