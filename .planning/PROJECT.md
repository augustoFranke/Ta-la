# Ta la

## What This Is

Ta la is a location-based social mobile app for people in Dourados, MS, Brazil to discover venues, check in with server-validated proximity, find other users at the same place, and interact through drink offers. The app enforces trustworthy presence via PostGIS-backed server RPCs, provides same-venue discovery with visibility and recency controls, includes block/report moderation, and delivers configurable notification preferences. Built on Expo + Supabase with a shipped v1.0 MVP.

## Core Value

People can reliably discover who is at the same venue right now, with trustworthy proximity-based check-in.

## Current Milestone

**v1.2 Venue Discovery** — Fix home screen venue display by removing nightlife score filtering and using whitelist-only approach. Polish existing features for reliability and user experience.

## Requirements

### Validated

- ✓ User can authenticate via Supabase OTP/email flow and persist session state — existing
- ✓ User can complete onboarding (photos, bio, interests, preferences) and access tab experience — existing
- ✓ User can browse nearby venues with location permissions and venue detail navigation — existing
- ✓ User can perform venue-based check-in and see users in the same venue from discover flow — existing
- ✓ User can view and edit profile information and photos — existing
- ✓ User can check in only when server-side validation confirms venue proximity (100m via PostGIS ST_DWithin) — v1.0
- ✓ User sees a clear pt-BR denial reason when check-in fails (distance, stale location, cooldown, or suspicious movement) — v1.0
- ✓ User has at most one active check-in at a time, with automatic expiry via pg_cron — v1.0
- ✓ User can see a here-now list of people at the same venue with recency indicators — v1.0
- ✓ User can choose visibility mode per check-in (public, friends-only, private) — v1.0
- ✓ User never sees blocked users in discovery and roster views — v1.0
- ✓ User can block another user from venue roster and profile screens — v1.0
- ✓ User can report another user with a predefined reason and optional note — v1.0
- ✓ User can unlock venue drink offers only after a valid active check-in — v1.0
- ✓ User can see offer status clearly (available, unlocked, expired, unavailable) — v1.0
- ✓ User can configure notification preferences by type (social vs venue offers) — v1.0
- ✓ User receives only notification categories they opted in to — v1.0
- ✓ Party entry via deep link — invite link/QR → land on party venue — v1.1
- ✓ Presence confirmation prompt — periodic "Ainda esta aqui?" during check-in — v1.1
- ✓ Availability toggle — manual Disponivel/Indisponivel controlling drink offer reception — v1.1
- ✓ Realtime discovery — Supabase Realtime for venue roster updates at party scale — v1.1
- ✓ Fraud threshold calibration — review trust parameters for party context — v1.1
- ✓ Tech debt cleanup — remove dead files with LSP errors, tighten types — v1.1

### Active

- [ ] Venue filtering — remove nightlife score threshold, use whitelist-only approach
- [ ] Home screen — display nearby bars, pubs, lounges, breweries reliably
- [ ] Whitelist expansion — add beer_bar and other nightlife types to approved list

### Out of Scope

- In-app chat/messaging — explicitly excluded
- Venue vibes/dating score — deferred until core loop is stable
- Development-build-only native workflows — constrained to Expo Go / EAS Preview
- Always-on background location tracking — conflicts with privacy-first explicit check-in model
- Public global map of all users — high safety/privacy risk
- Swift Live Activities — Apple Developer Program cost
- Location-based venue browsing fix — party uses invite link
- friends_only visibility filtering — deferred

## Context

- v1.0 MVP shipped 2026-02-10: 4 phases, 8 plans, 18 feat commits, 28 files changed, 2,400 insertions.
- v1.1 Party Prep shipped 2026-02-11: 3 phases (5-7), 5 plans, party features + tech debt cleanup.
- v1.2 Venue Discovery started 2026-02-11: fix home screen venue display, remove nightlife scoring.
- Architecture is route-first with domain hooks (`src/hooks/`), Zustand stores (`src/stores/`), and service boundaries (`src/services/`).
- Backend uses Supabase Auth + Postgres with RPC-driven check-in/discovery/offer behavior. Key RPCs: `check_in_to_place_v2`, `get_users_at_venue`, `send_drink_offer_v2`, `should_notify_user`.
- All trust-critical operations use SECURITY DEFINER RPCs that validate auth.uid() internally.
- Client uses Expo Router file-based routing under `app/`, with `(auth)/` and `(tabs)/` route groups.
- Deep link scheme `tala://` configured in app.json, implemented in v1.1 for party invites.
- Settings screen fully functional (theme, location, notifications, logout).
- User profile screen (`app/user/[id].tsx`) already has drink offer button.
- Foursquare Places API integrated but nightlife scoring algorithm too strict — bars (60 pts → 35 score) rejected by 40 threshold.

## Constraints

- **Tech stack**: Keep Expo Router + React Native + TypeScript + Zustand + Supabase — aligns with existing architecture and avoids migration churn
- **Localization**: User-facing copy must remain pt-BR — product target is Dourados, MS users
- **MVP scope**: Prioritize drink offers, check-in, and same-venue discovery — these define immediate product value
- **Check-in integrity**: Presence must validate proximity (100m) with backend enforcement via PostGIS — trust in presence is critical
- **Build approach**: Expo Go / EAS Preview only — avoid introducing custom dev-build requirements
- **Server-authoritative pattern**: Trust-critical operations must use SECURITY DEFINER RPCs, not client-side logic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Initialize as brownfield with inferred validated capabilities | Existing app already ships core flows and has codebase map artifacts | ✓ Good — avoided rebuilding existing functionality |
| Keep MVP boundaries strict (no chat, no dating score) | Prevent scope creep and focus on validating venue presence loop | ✓ Good — shipped focused v1.0 in 1 day |
| Use auto workflow to generate planning artifacts end-to-end | Faster transition from map to executable phases | ✓ Good — 4 phases planned and executed efficiently |
| SECURITY DEFINER RPCs for all trust boundaries | Server validates auth.uid() internally, bypasses RLS for cross-user checks | ✓ Good — consistent pattern across check-in, offers, notifications |
| Server-authoritative check-in (remove client distance gate) | Single source of truth for proximity; prevents client spoofing | ✓ Good — cleaner architecture, single enforcement point |
| TEXT + CHECK constraint for visibility (not ENUM) | Simpler migration, no custom type management | ✓ Good — added column with ALTER TABLE, no ENUM creation needed |
| Set<string> for blocked user store | O(1) lookups for filtering in discovery lists | ✓ Good — fast client-side filtering, optimistic after new blocks |
| Opt-out notification model (all enabled by default) | Maximizes initial engagement, user opts out of what they don't want | ✓ Good — simpler onboarding, no setup friction |
| pt-BR error/denial messages mapped client-side | Server returns codes, client maps to localized strings | ✓ Good — separation of concerns, easy to add languages later |

---
*Last updated: 2026-02-11 — v1.2 Venue Discovery started*
