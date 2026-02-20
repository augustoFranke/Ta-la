# Ta la

## What This Is

Ta la is a location-based dating and social discovery app for young adults in Dourados, MS, Brazil. Users check in at nightlife venues and universities, see who else is there, and interact through drink offers, waves, and likes. Mutual interest unlocks real-time chat. The app solves the "I saw someone but don't know who they are" problem — a behavior already common in Dourados university culture (e.g., Instagram pages like tevinaunigran where people post photos of strangers asking "who is this?").

## Core Value

People can discover and connect with someone they've noticed at a venue or campus — without the fear of cold approach and rejection.

## Target User

- **Age:** 18-28
- **Status:** Single, looking for casual partners / hookups
- **Location:** Dourados, MS (universities + nightlife)
- **Behavior:** Goes out to bars/clubs on weekends, attends university events, uses Instagram actively
- **Acquisition priority:** Women first — if women are on the app, men will follow

## Core Loop

1. **Check in** at a venue (proximity-validated, <10m)
2. **Discover** who else is checked in at the same place
3. **Signal interest** via drink offer, wave, or like
4. **Match** when interest is mutual
5. **Chat** in real-time after matching

## Current Milestone: v2.0 MVP Relaunch

**Goal:** Rebuild the experience around the redefined vision — hookup-friendly dating discovery with chat, streamlined venue interaction, and optimized Google Places API integration.

**Launch target:** March 2026 — own event with ~50 guests for real-world testing.

## Requirements

See: `.planning/REQUIREMENTS.md`

## Existing Capabilities (from v1.0-v1.4)

- Email OTP auth + onboarding (photos, bio, interests, preferences)
- Server-authoritative check-in via PostGIS RPC (10m proximity target)
- Google Places API (New) integration (Pivoting from Foursquare)
- Same-venue user discovery with realtime roster updates
- Drink offers with server-enforced gating
- Block/report moderation with O(1) blocked-user filtering
- Notification preferences (social drinks, matches, venue offers)
- Profile management (photos, bio, occupation, interests)
- Home screen with nearby/trending venues + search
- Venue favorites
- Dark/light theme with persistence
- Dev testing tools (GPS override, simulated users)

## What Needs to Change

### New Features
- Real-time chat after match with media support (emojis, photos, links)
- Reading indicators in chat (empty/filled dots)
- Wave and Like interaction types alongside drink offers
- Instagram account tag on profile
- Spotify music taste on profile (Nice-to-have)
- "Frequents" view — people who checked in at a venue more than once

### UX Changes
- Remove venue detail page — check-in happens directly from venue cards
- Distance-gated check-in: "Voce esta longe" when >10m, "Fazer check-in" when <10m
- Remove Explorar tab
- Redesign Parceiros tab — promote verified venues and manual Ta la events
- 4-tab navigation: Inicio, Parceiros, Chat, Minha conta

### Infrastructure
- **Google Places API (New)**: Cost-optimized implementation with aggressive caching.
- **Client-side Distance**: Haversine formula for distance display to save API costs.

## Constraints

- **Build:** Expo Go / EAS Preview only — no development builds (cost constraint)
- **Stack:** Expo Router + React Native + TypeScript + Zustand + Supabase
- **Localization:** All user-facing text in pt-BR
- **Timeline:** Must be testable at a real event in March 2026 (~50 guests)
- **Server-authoritative:** Trust-critical operations stay in SECURITY DEFINER RPCs

## Out of Scope

- Venue vibes/dating score algorithms
- Always-on background location tracking
- Public global map of all users
- Venue owner/partner dashboard
- friends_only visibility filtering logic
- Native development builds
- **Venue Type Expansion**: University/Campus venues and large-scale festival integration are post-MVP.

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Google Places API (New) | Pivot from Foursquare for better data quality in Brazil; optimized for cost | New |
| Chat in MVP | Core to hookup use case — match without chat is dead end | New |
| 4-tab nav | Dedicated Chat tab improves engagement and accessibility | New |
| Remove venue detail page | Reduces friction to check-in; venue info is secondary to people | New |
| 10m check-in radius | Tighter proximity = higher trust that person is actually there | New |
| Haversine Formula | Avoid Google Distance Matrix API costs by calculating distance locally | New |
| 3 interaction types | Options without friction; wave/like are lower commitment than drink | New |


---
*Last updated: 2026-02-16 — v2.0 MVP Relaunch defined*
