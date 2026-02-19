# Requirements: Ta la!

**Redefined:** 2026-02-16
**Core Value:** People can discover and connect with someone they've noticed at a venue or campus — without the fear of cold approach and rejection.
**Launch Target:** March 2026 — real event with ~50 guests.

## v2.0 MVP Relaunch Requirements

### Chat System (CHAT)

- [ ] **CHAT-01**: After mutual match, a chat screen is unlocked between the two users
- [ ] **CHAT-02**: Messages are delivered in real-time via Supabase Realtime
- [ ] **CHAT-03**: Chat list shows all active conversations with last message preview and timestamp
- [ ] **CHAT-04**: Unread message indicator visible on chat list and tab
- [ ] **CHAT-05**: Messages persist across sessions (stored in Supabase `messages` table)
- [ ] **CHAT-06**: Chat has a dedicated tab in the main navigation bar
- [ ] **CHAT-07**: Support for emojis, photos, and embedded links in messages
- [ ] **CHAT-08**: Reading indicator: empty dot for unread messages, filled dot when read
- [ ] **CHAT-09**: Chat header displays user name and picture; clicking opens the user's profile

### Interaction Types (INTERACT)

- [ ] **INTERACT-01**: User can send a drink offer to someone at the same venue (existing, keep)
- [ ] **INTERACT-02**: User can send a wave to someone at the same venue (low-commitment signal)
- [ ] **INTERACT-03**: User can send a like to someone at the same venue (interest signal)
- [ ] **INTERACT-04**: All three interaction types create a pending connection; mutual interaction from either side = match
- [ ] **INTERACT-05**: UI clearly distinguishes the three options without adding cognitive friction
- [ ] **INTERACT-06**: Receiver sees which type of signal was sent (drink, wave, or like)

### Profile Enhancements (PROFILE)

- [ ] **PROFILE-01**: User can add their Instagram handle to their profile
- [ ] **PROFILE-02**: Instagram handle is displayed on public profile and discovery cards
- [ ] **PROFILE-03**: User can add Spotify music taste / top artists to their profile
- [ ] **PROFILE-04**: Spotify info is displayed on public profile

### Venue UX Overhaul (VENUE-UX)

- [x] **VENUE-UX-01**: Remove venue detail page — no more `/venue/[id]` navigation
- [x] **VENUE-UX-02**: Check-in button lives directly on venue cards on the home screen
- [x] **VENUE-UX-03**: When user is >10m from venue, card shows "Voce esta longe" (disabled state)
- [x] **VENUE-UX-04**: When user is <=10m from venue, card shows "Fazer check-in" (enabled state)
- [x] **VENUE-UX-05**: Check-in flow (open_to_meeting toggle, visibility) happens via modal from venue card
- [x] **VENUE-UX-06**: Check-in proximity threshold reduced from 100m to 10m in server RPC

### Venue Data (VENUE-DATA)

- [x] **VENUE-DATA-01**: Replace Foursquare integration with Google Places API (New)
- [x] **VENUE-DATA-02**: Implement cost-saving measures via optimized API usage
- [x] **VENUE-DATA-03**: Implement aggressive cache persistence to minimize redundant requests
- [x] **VENUE-DATA-04**: Use client-side Haversine formula for distance calculations instead of API calls
- [x] **VENUE-DATA-05**: Implement semantic filtering of venues to ensure "nightlife activity" focus

### Discovery Enhancements (DISCOVER)

- [ ] **DISCOVER-01**: "Here now" section shows users currently checked in at the venue (existing, keep)
- [ ] **DISCOVER-02**: "Frequents" section shows users who have checked in at this venue more than once (distinct visual treatment)
- [ ] **DISCOVER-03**: Frequents query considers historical check-ins, not just currently active ones

### Navigation Restructure (NAV)

- [x] **NAV-01**: Remove Explorar tab entirely
- [x] **NAV-02**: Tab bar has 4 tabs: Inicio, Parceiros, Chat, Minha conta
- [ ] **NAV-03**: Parceiros tab promotes verified venues with nightlife / hookup culture focus
- [ ] **NAV-04**: Parceiros tab shows upcoming "Tá lá" events (manually managed)

### Cleanup (CLEAN)

- [x] **CLEAN-01**: Remove dead code: `getPhotoUrl()`, `checkShouldNotify()`, `unblockUser()`, redundant re-export in places.ts
- [x] **CLEAN-02**: Reset all user-scoped stores on logout (checkIn, venue, block, notification)
- [x] **CLEAN-03**: Remove `/venue/[id]` route and associated components after venue UX overhaul

## Existing Capabilities (Validated, No Changes Needed)

- [x] Email OTP auth + onboarding flow
- [x] Server-authoritative check-in via PostGIS RPC
- [ ] Google Places API (New) venue discovery (Pivoting from Foursquare)
- [x] Same-venue user discovery with Supabase Realtime
- [x] Block/report moderation
- [x] Notification preferences
- [x] Profile CRUD (photos, bio, occupation, interests)
- [x] Home screen with nearby/trending venues + search
- [x] Venue favorites
- [x] Dark/light theme
- [x] Presence confirmation ("Ainda esta aqui?")
- [x] Availability toggle (Disponivel para drinks)
- [x] Dev testing tools (GPS override, simulated users)

## Out of Scope

- Venue vibes/dating score algorithms
- Always-on background location tracking
- Public global map of all users
- Venue partner self-serve dashboard
- friends_only visibility filtering
- Native development builds
- **Venue Type Expansion**: Universities, event spaces, and festivals are out of MVP scope; these will be handled separately via event managers.

## Priority for March Event

**Must-have (blocks event testing):**
1. CHAT-01 through CHAT-09 — complete chat experience
2. VENUE-UX-01 through VENUE-UX-06 — streamlined check-in flow
3. VENUE-DATA-01 through VENUE-DATA-05 — Google Places API integration
4. NAV-01 through NAV-04 — clean navigation and Parceiros content
5. CLEAN-01, CLEAN-02 — stability fixes

**Should-have (improves event experience):**
6. INTERACT-01 through INTERACT-06 — wave/like alongside drink
7. PROFILE-01, PROFILE-02 — Instagram handle
8. DISCOVER-02, DISCOVER-03 — frequents view

**Nice-to-have (can ship post-event):**
9. PROFILE-03, PROFILE-04 — Spotify integration

## Traceability

| Requirement | Priority | Phase | Status |
|-------------|----------|-------|--------|
| CHAT-01..09 | Must-have | TBD | Pending |
| VENUE-UX-01..06 | Must-have | TBD | Pending |
| VENUE-DATA-01..05 | Must-have | TBD | Pending |
| NAV-01..04 | Must-have | TBD | Pending |
| CLEAN-01..02 | Must-have | TBD | Pending |
| INTERACT-01..06 | Should-have | TBD | Pending |
| PROFILE-01..02 | Should-have | TBD | Pending |
| DISCOVER-02..03 | Should-have | TBD | Pending |
| PROFILE-03..04 | Nice-to-have | TBD | Pending |
| CLEAN-03 | Depends on VENUE-UX | TBD | Pending |

---
*Last updated: 2026-02-16 — v2.0 MVP Relaunch requirements defined*
