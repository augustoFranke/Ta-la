# Trust Thresholds Reference

## Overview

Parameters controlling check-in trust boundary in `check_in_to_place_v2` and related functions.
All values are enforced server-side via SECURITY DEFINER RPCs — clients cannot bypass them.

## Current Values (v1.1 Party Prep)

| Parameter | Value | Migration | Rationale |
|-----------|-------|-----------|-----------|
| Distance | 100m | 020, 029 | ST_DWithin check. Covers most venue footprints including outdoor areas. No change for parties. |
| Location freshness | 60s | 020, 029 | Rejects GPS readings older than 60 seconds. Prevents replay attacks with cached coordinates. No change needed. |
| Cooldown after checkout | 5 min | 029 (was 15 min in 020) | Prevents check-in/out gaming for drink offers. Reduced from 15 min — party users may briefly step outside. 5 min is sufficient anti-abuse buffer. |
| Auto-expiry | 8 hours | 029 (was 4 hours in 011) | Marks stale check-ins inactive. Increased from 4h — parties run 4-8+ hours. With presence confirmation (30 min interval, Phase 6), genuinely inactive users are still caught. |
| Expiry cron interval | 5 min | 021 | How often auto_checkout_expired() runs. Unchanged — 5 min granularity is fine for 8h window. |

## Unchanged Parameters

- **One-active-check-in**: User can only be checked into one venue at a time. Enforced by deactivating previous check-in on new check-in.
- **Presence confirmation**: 30-minute interval prompt for active check-ins (client-side, Phase 6). Not a server threshold — behavioral prompt only.

## Denial Codes

| Code | Condition | pt-BR Message (client) |
|------|-----------|----------------------|
| not_authenticated | auth.uid() is NULL | Voce precisa estar logado para fazer check-in. |
| too_far | > 100m from venue | Voce esta muito longe deste local. Aproxime-se para fazer check-in. |
| stale_location | GPS reading > 60s old | Sua localizacao esta desatualizada. Aguarde a atualizacao do GPS e tente novamente. |
| cooldown | Checkout from same venue < 5 min ago | Voce fez check-out deste local recentemente. Aguarde alguns minutos para fazer check-in novamente. |

## Future Calibration Notes

- Distance may need increase for large open-air venues (festivals, parks). Monitor `too_far` denial rate at party events.
- Cooldown could be further reduced if gaming is not observed in party telemetry.
- Auto-expiry could be made per-event if event duration metadata is added later.
- Consider adding accuracy-based gating (reject if p_user_accuracy > 500m) if GPS spoofing is detected.
