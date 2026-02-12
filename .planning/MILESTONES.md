# Milestones

## v1.0 MVP

**Shipped:** 2026-02-10
**Phases:** 1-4 (8 plans, 18 feat commits)
**Stats:** 28 files changed, 2,400 insertions, 297 deletions
**Timeline:** 2026-02-10 (1 day execution)
**Git range:** 317d8bb -> 6e14fd2

### Delivered

Trustworthy proximity-based check-in, same-venue discovery with visibility controls, block/report moderation, server-enforced drink offers, and configurable notification preferences — the complete v1 trust loop for venue-based social discovery.

### Key Accomplishments

1. Server-authoritative check-in trust boundary via `check_in_to_place_v2` RPC (PostGIS ST_DWithin 100m, freshness, cooldown) + `pg_cron` auto-expiry
2. Client check-in hook calling server RPC with fresh GPS, pt-BR denial messages for all failure modes
3. Visibility controls (public/friends_only/private) on check-ins + recency indicators on discover roster
4. Block/report moderation system — service, Zustand store, UI on profile + discover, client-side filtering with O(1) Set lookups
5. Server-enforced drink offer gating via `send_drink_offer_v2` SECURITY DEFINER RPC + clear pt-BR offer state labels
6. Notification preferences system — DB table, types, service, store, settings UI toggles, `should_notify_user` enforcement RPC

### Archive

- Roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`

---

## v1.1 Party Prep

**Shipped:** 2026-02-11
**Phases:** 5-7 (5 plans)

### Delivered

Party-ready features: deep link invite flow, presence confirmation prompts, availability toggle, realtime venue roster updates, and trust threshold calibration for party context.

### Key Accomplishments

1. Deep link scheme `tala://` for party invites — QR/link -> venue detail screen
2. Presence confirmation prompts — periodic "Ainda esta aqui?" during active check-in
3. Availability toggle — manual Disponivel/Indisponivel on profile for drink offer reception
4. Realtime discovery — Supabase Realtime subscription for venue roster updates
5. Trust calibration — 8h auto-expiry, 5min cooldown (adjusted for party context)
6. Tech debt cleanup — removed dead files with LSP errors, tightened types

---

## v1.2 Venue Discovery

**Shipped:** 2026-02-11
**Phases:** 8-9 (2 plans, 2 commits)
**Stats:** 2 files changed
**Git range:** 51b629f -> 38de97f

### Delivered

Fixed venue discovery by replacing nightlife score filtering with whitelist-only approach. Polished home screen with better error handling, loading states, and permission prompts.

### Key Accomplishments

1. Removed `NIGHTLIFE_SCORE_THRESHOLD` — bars were being rejected at 35 score vs 40 threshold
2. Added `NIGHTLIFE_TYPES` whitelist (19 types) for clear venue inclusion criteria
3. Simplified `isAllowedVenue()` to whitelist check (no scoring)
4. Added `Linking.openSettings()` for permission denied state
5. Conditional empty state messaging (search vs no venues)
6. Error retry button with refresh icon

---

## v1.3 Production Ready

**Shipped:** 2026-02-11
**Phases:** 10-11 (2 commits)
**Stats:** 4 files changed, 105 insertions, 102 deletions
**Migrations deployed:** 11 (020-030)
**Git range:** ead1be0 -> 8259707

### Delivered

Removed unwanted UI elements, fixed venue photos by requesting rich data from Foursquare API, created favorites migration, and deployed all 30 pending migrations to production Supabase.

### Key Accomplishments

1. Removed day pills calendar and subtitle text from home screen (user-reported Issues I, II)
2. Added `fields` param to Foursquare search to request photos as Rich Data (Issue III)
3. Added `fetchPlacePhotos()` service for dedicated photo fetching on venue detail
4. Created `user_favorite_places` migration with RLS policies (Issue IV)
5. Fixed migration 023 (DROP FUNCTION before replacing return type)
6. Deployed all 11 pending migrations — check-in RPC, availability, realtime, favorites all live
7. Resolved all 7 user-reported issues
