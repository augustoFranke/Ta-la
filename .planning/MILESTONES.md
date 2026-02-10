# Milestones

## v1.0 MVP

**Shipped:** 2026-02-10
**Phases:** 1-4 (8 plans, 18 feat commits)
**Stats:** 28 files changed, 2,400 insertions, 297 deletions
**Timeline:** 2026-02-10 (1 day execution)
**Git range:** 317d8bb → 6e14fd2

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
