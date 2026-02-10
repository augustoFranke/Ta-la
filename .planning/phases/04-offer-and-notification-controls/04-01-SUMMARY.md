---
phase: 04-offer-and-notification-controls
plan: 01
subsystem: api, ui
tags: [supabase-rpc, drink-offers, server-validation, pt-BR]

# Dependency graph
requires:
  - phase: 01-check-in-trust-core
    provides: check_ins table with is_active/checked_out_at columns
  - phase: 03-safety-and-moderation-enforcement
    provides: discover screen with block/report UI
provides:
  - Server-enforced drink offer gating via send_drink_offer_v2 RPC
  - Clear pt-BR offer state labels on discover screen
affects: [04-02-PLAN, notification-controls]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-authoritative-rpc-for-mutations, error-code-to-pt-BR-mapping]

key-files:
  created:
    - supabase/migrations/025_server_drink_offer_validation.sql
  modified:
    - src/services/drinks.ts
    - app/(tabs)/discover.tsx
    - app/user/[id].tsx

key-decisions:
  - "SECURITY DEFINER RPC replaces direct client INSERT for drink offers — server validates active check-in"
  - "Removed senderId from client params — server uses auth.uid() for sender identity"
  - "Error codes mapped to pt-BR messages client-side via DRINK_ERROR_MESSAGES constant"

patterns-established:
  - "Server-authoritative mutation pattern: RPC returns JSONB {success, error/result} instead of direct table insert"
  - "Error code → pt-BR message mapping pattern for user-facing errors"

# Metrics
duration: 2min
completed: 2026-02-10
---

# Phase 4 Plan 1: Server-Enforced Drink Offer Gating + Clear Offer State UI Summary

**SECURITY DEFINER RPC send_drink_offer_v2 validates active check-in before drink insert, with pt-BR offer state labels on discover screen**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-10T20:15:38Z
- **Completed:** 2026-02-10T20:17:24Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Server-side RPC validates active check-in at target venue before allowing drink offer insert
- Client service calls RPC instead of direct table insert, removing senderId from client params
- Discover screen shows clear pt-BR offer state labels: available, unavailable (with helper text), pending (with "Aguardando resposta")
- Error codes mapped to pt-BR user-facing messages for all failure cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Create send_drink_offer_v2 server RPC with active check-in validation** - `fe6f990` (feat)
2. **Task 2: Update discover screen with clear offer state labels and visual feedback** - `d9bd885` (feat)

## Files Created/Modified
- `supabase/migrations/025_server_drink_offer_validation.sql` - SECURITY DEFINER RPC with check-in validation, self-drink check, duplicate check
- `src/services/drinks.ts` - Updated to call RPC, removed senderId param, added DRINK_ERROR_MESSAGES pt-BR mapping
- `app/(tabs)/discover.tsx` - Clear state labels: "Faca check-in primeiro", "Aguardando resposta", helper text for unavailable state
- `app/user/[id].tsx` - Updated sendDrinkOffer call site to remove senderId

## Decisions Made
- SECURITY DEFINER RPC replaces direct client INSERT — server validates active check-in via is_active/checked_out_at
- Removed senderId from client params — server uses auth.uid() for sender identity (consistent with check_in_to_place_v2 pattern)
- Error codes mapped to pt-BR messages client-side via DRINK_ERROR_MESSAGES constant

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 04-02-PLAN.md (Notification preferences schema, service, store, and settings UI toggles)
- Server drink offer gating complete; notification controls can proceed independently

---
*Phase: 04-offer-and-notification-controls*
*Completed: 2026-02-10*
