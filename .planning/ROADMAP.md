# Roadmap: Ta la

## Milestones

- **v1.0 MVP** — Phases 1-4 (shipped 2026-02-10)
- **v1.1 Party Prep** — Phases 5-7 (shipped 2026-02-11)
- **v1.2 Venue Discovery** — Phases 8-9 (shipped 2026-02-11)
- **v1.3 Production Ready** — Phases 10-11 (shipped 2026-02-11)
- **v1.4 API Optimization & Check-in Testing** — Phases 12-13 (shipped 2026-02-12)
- **v2.0 MVP Relaunch** — Phases 14-19 (target: March 2026)

## v2.0 MVP Relaunch

**Started:** 2026-02-16
**Target:** March 2026 — real event with ~50 guests
**Goal:** Rebuild the experience around hookup-friendly dating discovery with chat, streamlined venue check-in, and multiple interaction types.

### Phase 14: Cleanup & Navigation Restructure

**Goal:** Clean foundation — remove dead code, fix logout state leaks, restructure to 4-tab navigation.

**Requirements:** CLEAN-01, CLEAN-02, NAV-01, NAV-02

**Plans:** 2/2 plans complete

Plans:
- [ ] 14-01-PLAN.md — Remove dead code and reset user-scoped stores on logout (CLEAN-01, CLEAN-02)
- [ ] 14-02-PLAN.md — Restructure to 4-tab navigation, remove Explorar, add Chat placeholder (NAV-01, NAV-02)

**Success Criteria:**
1. No dead code functions remain in services
2. Logout clears all stores — no stale data on re-login
3. Tab bar shows exactly 4 tabs
4. App builds and runs on Expo Go without errors

---

### Phase 15: Google Places API & Venue UX

**Goal:** Pivot to Google Places API (New) with optimized caching and direct check-in from venue cards.

**Requirements:** VENUE-DATA-01 through VENUE-DATA-05, VENUE-UX-01 through VENUE-UX-06, CLEAN-03

**Dependencies:** Phase 14 (clean foundation)

**Plans:** 5/5 plans complete

Plans:
- [ ] 15-01-PLAN.md — Replace Foursquare with Google Places API (New) + Field Masking + nightlife filtering
- [ ] 15-02-PLAN.md — 30-day aggressive cache with city-radius invalidation + client-side Haversine distance
- [ ] 15-03-PLAN.md — Rebuild VenueCard layout + lightweight check-in bottom sheet (no toggles)
- [ ] 15-04-PLAN.md — Home screen wiring: venue cards, skeleton, empty state, location banner, delete /venue/[id]
- [ ] 15-05-PLAN.md — Update check_in_to_place_v2 RPC proximity threshold from 100m to 10m

**Success Criteria:**
1. Venue discovery uses Google Places API (New)
2. Distance calculated locally (no API cost)
3. User can check in directly from home screen venue card
4. Cards show correct state based on 10m threshold
5. No venue detail page exists in the app

---

### Phase 16: Interaction Types (Wave & Like)

**Goal:** Users can signal interest via drink offer, wave, or like — all three create pending connections, mutual = match.

**Requirements:** INTERACT-01 through INTERACT-06

**Dependencies:** Phase 14 (clean stores)

**Plans:** 1/4 plans executed

Plans:
- [ ] 16-01-PLAN.md — Database: interactions table, match trigger v2, unmatch support, send_interaction RPC, get_received_interactions RPC
- [ ] 16-02-PLAN.md — Service layer: TypeScript types, interactions service, useInteractionRealtime hook
- [ ] 16-03-PLAN.md — UI components: ConfirmationDialog, InteractionButtons, MatchCelebration, ReceivedInteractions
- [ ] 16-04-PLAN.md — Screen wiring: discover screen + user profile with full interaction flow

**Success Criteria:**
1. User can send drink, wave, or like to another user at same venue
2. Receiver sees which type was sent
3. Mutual interaction (any combination) creates a match
4. UI is clear and doesn't add cognitive friction

---

### Phase 17: Chat System Enhancements

**Goal:** Matched users can chat in real-time with media support and clear status indicators.

**Requirements:** CHAT-01 through CHAT-09

**Dependencies:** Phase 16 (matches must work)

**Tasks:**
1. Create chat UI — conversation list screen + individual chat screen (4th tab)
2. Wire Supabase Realtime subscription for message delivery
3. Implement media support: emojis, photo uploads, and link previews
4. Add reading indicators (empty dot -> filled dot)
5. Add profile header to chat (click user to open profile)
6. Add unread message indicators to tab bar and chat list

**Success Criteria:**
1. Chat is accessible via the 4th navigation tab
2. Messages appear in real-time with support for photos and emojis
3. Reading status is clearly visible via dot indicators
4. User can access the other person's profile from the chat header
5. Unread indicators correctly reflect message status

---

### Phase 18: Profile Enhancements

**Goal:** Profiles show Instagram handle and Spotify taste — social proof and conversation starters.

**Requirements:** PROFILE-01 through PROFILE-04

**Dependencies:** None (can run in parallel with Phase 16/17)

**Tasks:**
1. Add `instagram_handle` and `spotify_data` columns to users table (migration)
2. Add Instagram input to profile edit screen
3. Display Instagram handle on public profile and discovery cards
4. Add Spotify music taste section to profile (manual input or API integration)
5. Display Spotify info on public profile

**Success Criteria:**
1. User can add/edit Instagram handle on their profile
2. Instagram handle visible on discovery cards and public profile
3. Spotify music taste editable and visible on profile

---

### Phase 19: Discovery Enhancements

**Goal:** Discover screen shows "here now" and "frequents" sections — people who regularly visit this venue.

**Requirements:** DISCOVER-01 through DISCOVER-03

**Dependencies:** Phase 15 (venue UX must be stable)

**Tasks:**
1. Add "Frequents" section to discover screen below "Here now"
2. Query historical check-ins (users with >1 check-in at this venue)
3. Distinct visual treatment for frequents vs. currently checked-in users
4. Interaction buttons work on frequents cards same as here-now cards

**Success Criteria:**
1. Discover screen has two sections: "Aqui agora" and "Frequenta este local"
2. Frequents shows users who checked in >1 time (not necessarily here now)
3. Visual distinction between the two sections is clear

---

## Phase Dependencies

```
Phase 14 (Cleanup & Nav)
  |
  +---> Phase 15 (Venue UX Overhaul)
  |       |
  |       +---> Phase 19 (Discovery: Frequents)
  |
  +---> Phase 16 (Interaction Types)
          |
          +---> Phase 17 (Chat System)

Phase 18 (Profile: Instagram + Spotify) — independent, parallel
```

## Progress

| Phase | Milestone | Status | Target |
|-------|-----------|--------|--------|
| 1-4 | v1.0 MVP | Complete | 2026-02-10 |
| 5-7 | v1.1 Party Prep | Complete | 2026-02-11 |
| 8-9 | v1.2 Venue Discovery | Complete | 2026-02-11 |
| 10-11 | v1.3 Production Ready | Complete | 2026-02-11 |
| 12-13 | v1.4 API Optimization | Complete | 2026-02-12 |
| 14 | 1/2 | Complete    | 2026-02-19 |
| 15 | 5/5 | Complete    | 2026-02-19 |
| 16 | 1/4 | In Progress|  |
| 17 | v2.0 Chat System | Pending | — |
| 18 | v2.0 Profile Enhancements | Pending | — |
| 19 | v2.0 Discovery Enhancements | Pending | — |

## March Event Readiness

**Minimum viable for event:** Phases 14, 15, 16, 17
**Enhanced experience:** + Phase 18 (Instagram), + Phase 19 (Frequents)

---
*Last updated: 2026-02-16 — v2.0 MVP Relaunch roadmap created*
