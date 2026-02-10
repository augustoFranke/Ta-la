# Project Research Summary

**Project:** Ta la
**Domain:** Brownfield location-based social mobile app (Expo + Supabase) for trusted venue check-ins and same-venue discovery
**Researched:** 2026-02-10
**Confidence:** MEDIUM

## Executive Summary

Ta la is a trust-sensitive location-social product where the core value depends on one thing: users must believe that people shown at a venue are actually there now. The combined research points to a server-authoritative architecture (Supabase Postgres + PostGIS + RPC + RLS) with a thin Expo client, not a client-heavy validation model. Experts in this category prioritize explicit check-ins, strict privacy controls, and short-lived presence over passive always-on tracking.

The recommended path is to harden foundations before adding novelty: formalize SQL contracts/migrations, enforce geospatial validation and anti-abuse in DB functions, then build discovery read models and realtime reconciliation on top. For state management, keep Zustand for local/UI state and adopt React Query for server state to reduce sync drift and retry inconsistencies. Launch scope should stay focused on reliable check-in, here-now roster with visibility controls, moderation controls, offer-linked unlocks, and notification preferences.

The largest risks are false presence (spoofed/stale location), privacy/security failures (RLS gaps, over-retained precise location), and realtime consistency drift (ghost users, channel leaks, delete semantics). Mitigation is clear and actionable: Phase 1 trust boundary + RLS hardening as release blocker, Phase 2 presence lifecycle/realtime hygiene with reconciliation, and Phase 4 migration/testing gates (pgTAP + CI reset/type checks) to prevent regressions.

## Key Findings

### Recommended Stack

The strongest evidence supports staying on the existing Expo Router + Supabase architecture and hardening it with PostGIS, DB contracts, and reliability tooling rather than introducing a platform migration.

**Core technologies:**
- Expo SDK `~54` + React Native `0.81.x` + Expo Router `6.x`: mobile runtime/navigation baseline - avoids rewrite risk in brownfield app.
- Supabase (`@supabase/supabase-js` `^2.95`): auth/data/realtime/functions - central trust boundary for check-in and discovery logic.
- PostGIS (`geography(POINT)` + GIST): accurate, index-backed proximity validation and nearby queries.
- React Query `^5.90` + Zustand split: predictable server-state caching/retries while keeping local app state simple.
- `react-hook-form` + `zod`: stronger payload validation for medium/critical forms.
- Sentry + Expo testing stack (`jest-expo`, Testing Library, Expo Router test utilities): reliability/observability baseline.

Critical version requirement: keep Expo SDK-aligned versions (`expo`, `react-native`, `expo-router`, `jest-expo`) in lockstep to avoid runtime/native drift.

### Expected Features

Research converges on a safety-first MVP: trusted check-ins, controlled visibility, and actionable social discovery in-venue, not broad public broadcasting.

**Must have (table stakes):**
- Reliable proximity check-in with anti-abuse constraints.
- Here-now roster with per-check-in visibility controls and freshness window.
- Block/report actions directly in roster/profile.
- Offer-linked check-in unlock (basic) for monetizable venue value.
- Notification preferences by type (social vs offers).

**Should have (competitive):**
- Trust-first discovery ranking once enough behavior data exists.
- Local crowd pulse by venue/time once volume is sufficient.
- Private-first venue memory timeline for retention.

**Defer (v2+):**
- In-app chat/messaging (explicit anti-feature for MVP).
- Global live user map and always-on background tracking.
- Heavy gamification economy until trust metrics are stable.

### Architecture Approach

Adopt a strict Route -> Hook -> Service -> RPC boundary. Route files only orchestrate UI intent; feature hooks own use-cases; services are typed adapters; SQL/RPC + RLS enforce invariants. Major components are: (1) route/presentation layer in `app/*`, (2) feature modules (`checkin`, `discovery`, `venues`) with dedicated hooks/services/stores, (3) Supabase data-policy layer (migrations, RPC, RLS, indexes, cron), and (4) observability boundary (Sentry + DB metrics/logging). Build order should follow dependency reality: DB contracts first, then check-in reliability, then discovery read-model/realtime, then observability/performance tuning.

### Critical Pitfalls

1. **Client-only geofence validation** - enforce `ST_DWithin` + accuracy/timestamp checks server-side; treat mocked/stale readings as risk.
2. **Geospatial modeling mistakes (lon/lat/SRID/type)** - standardize `geography(POINT)` and a single canonical eligibility function with boundary tests.
3. **Incomplete RLS on check-in/presence data** - enforce operation-specific policies with authenticated checks and CI policy tests.
4. **Realtime lifecycle leaks and ghost presence** - use singleton client, disciplined unsubscribe/logout cleanup, server TTL/heartbeat, and reconcile queries.
5. **Migration/test discipline gaps** - migration-first workflow, reproducible `db reset` in CI, generated types, pgTAP and integration gates.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Trust Boundary and Data Contracts
**Rationale:** Every downstream feature depends on reliable and secure presence truth.
**Delivers:** Versioned SQL contracts (`check_in_to_place_v2`/`can_check_in`), PostGIS model/indexes, hardened RLS, generated DB types, baseline db tests.
**Addresses:** Reliable proximity check-in, anti-abuse foundation, privacy baseline for visibility controls.
**Avoids:** Client-only validation, geospatial errors, RLS exposure.

### Phase 2: MVP Check-In and Offer Unlock Loop
**Rationale:** Fastest path to validating core user + venue value once trust layer exists.
**Delivers:** End-to-end check-in UX with specific failure states, one-active-check-in behavior, offer unlock after valid check-in, notification preference center.
**Uses:** React Query mutation/query flows, Expo Location foreground checks, server-authoritative RPC decisions.
**Implements:** Check-in feature module boundary (hook/service/store) and route isolation.
**Avoids:** Offer abuse via remote/spoofed check-ins.

### Phase 3: Discovery Presence and Safety Operations
**Rationale:** Social payoff requires safe, fresh, and scalable here-now discovery.
**Delivers:** Venue roster with recency window, per-check-in visibility modes, block/report in discovery surfaces, realtime incremental updates + reconciliation.
**Addresses:** Here-now roster, visibility controls, moderation controls.
**Avoids:** Ghost users, channel exhaustion, stale UI after reconnect/deletes.

### Phase 4: Observability, Quality Gates, and Release Discipline
**Rationale:** Prevent silent regressions in a fraud/privacy-sensitive domain.
**Delivers:** Sentry instrumentation with correlation IDs, SLOs (check-in success/latency, discovery freshness), pgTAP + integration suite, CI gates (`db reset`, type generation, contract checks).
**Addresses:** Reliability at launch and safe iteration velocity.
**Avoids:** Migration drift, policy regressions, untraceable production incidents.

### Phase 5: Post-Launch Differentiators
**Rationale:** Add competitive features only after trust/safety and data quality are proven.
**Delivers:** Trust-first ranking, local crowd pulse, private venue memory timeline.
**Addresses:** Differentiation and retention without expanding risk surface prematurely.
**Avoids:** Premature complexity and incentive-driven trust erosion.

### Phase Ordering Rationale

- Phase order follows hard dependencies: trust contracts -> monetizable MVP loop -> discovery scale/safety -> operational hardening -> differentiators.
- Grouping mirrors architecture boundaries, which reduces coupling and supports clearer ownership.
- Early focus on pitfalls (fraud, RLS, realtime drift) prevents rework and incident-driven roadmap churn.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Realtime topology under expected fan-out in Dourados, including reconcile cadence and channel budgets.
- **Phase 5:** Ranking heuristics fairness/abuse resistance and minimum data thresholds for reliable local crowd pulse.
- **Phase 4:** LGPD operationalization details (retention windows, incident playbooks, deletion workflows) with legal review.

Phases with standard patterns (skip research-phase):
- **Phase 1:** PostGIS + RLS + migration-first patterns are well-documented in official Supabase/Postgres guidance.
- **Phase 2:** Expo foreground location + RPC command pipeline is a standard and already strongly supported by current research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Predominantly official Expo/Supabase docs with concrete version compatibility and operational guidance. |
| Features | MEDIUM | Mix of strong competitor support docs and product-strategy inference for local differentiation. |
| Architecture | MEDIUM | Strong platform patterns, but some project-specific assumptions still need validation against current codebase constraints. |
| Pitfalls | MEDIUM | Mostly official technical/legal sources; impact is clear, but thresholds/mitigations need environment-specific tuning. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Fraud heuristic thresholds:** Define concrete limits (accuracy, cooldown, impossible travel) using real launch telemetry, not static assumptions.
- **Realtime scale envelope:** Validate channel/event budgets with load tests matching expected venue concurrency.
- **Privacy operations detail:** Finalize LGPD retention TTLs, purge schedule, and user deletion workflow before production launch.
- **Data quality for ranking/pulse:** Establish minimum signal thresholds to avoid noisy or manipulable discovery outputs.

## Sources

### Primary (HIGH confidence)
- Expo docs (`Location`, `Router`, `Testing`, `EAS Workflows`, `Sentry`) - runtime constraints, testing patterns, and observability integration.
- Supabase docs (`PostGIS`, `RLS`, `Functions`, `Realtime Postgres Changes/Broadcast/Limits`, `Cron`, `DB testing`, `Generated types`, `CLI`) - trust boundaries, scaling caveats, and migration/testing discipline.
- PostGIS docs (`ST_DWithin`) - canonical geospatial distance semantics.
- LGPD official law text (Lei 13.709/2018) - legal basis for minimization, purpose limitation, retention, and deletion controls.

### Secondary (MEDIUM confidence)
- Swarm official product/support docs - expectations for check-in mechanics, visibility controls, anti-abuse, and safety affordances.
- Snapchat/Google support docs - privacy and location-sharing expectation signals for mainstream users.

### Tertiary (LOW confidence)
- No material low-confidence single-source claims identified; remaining uncertainty is execution calibration rather than source credibility.

---
*Research completed: 2026-02-10*
*Ready for roadmap: yes*
