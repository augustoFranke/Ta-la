# Stack Research

**Domain:** Brownfield location-based social mobile app (Expo + Supabase) focused on reliable venue check-ins and nearby user discovery
**Researched:** 2026-02-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Expo + React Native + Expo Router | Expo SDK `~54`, RN `0.81.x`, Expo Router `6.x` | Mobile runtime and navigation | Keep the baseline and harden around it instead of migrating navigation/runtime. This avoids rewrite risk and stays aligned with current Expo docs and testing support (HIGH). |
| Supabase (Postgres + Auth + Realtime + Edge Functions) | `@supabase/supabase-js` `^2.95`, Supabase managed platform current | Backend API, auth, realtime sync, server-side validation | For this app shape, reliability comes from moving trust-critical logic (check-in validation, anti-abuse, idempotency) into DB/Edge Functions while keeping mobile client thin (HIGH). |
| PostGIS on Supabase | Supabase extension (managed) | Accurate distance/bounds queries and indexable geospatial data | Standard evolution for discovery/check-in apps: use `geography(POINT)`, GIST indexes, and SQL/RPC for distance checks instead of ad hoc client Haversine logic (HIGH). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query` | `^5.90` | Server-state cache, retries, stale control, invalidation | Use for offers/check-ins/discovery reads and mutations; keep Zustand for UI/local app state only. This split reduces drift and race conditions (MEDIUM-HIGH). |
| `expo-network` | `~8.0` | Network connectivity signals | Wire to React Query `onlineManager` so refetch/retry behavior is mobile-aware (MEDIUM-HIGH). |
| `react-hook-form` + `zod` + `@hookform/resolvers` | `^7.71` + `^4.3` + `^5.2` | Typed form validation and safer payload contracts | Use on check-in/reporting forms where validation quality matters; keep simple `useState` for tiny forms per current project rules (HIGH). |
| `jest-expo` + `@testing-library/react-native` + `expo-router/testing-library` | `~54.0` + `^13.3` + Router `6.x` | Unit/integration test base for RN + Expo Router | Use for fast reliability gates: check-in flow logic, store actions, API adapters, and route-level behavior without device flakiness (HIGH). |
| `@sentry/react-native` | `^7.12` | Crash/error telemetry with symbolicated stack traces | Use in production to detect location failures, realtime disconnect loops, and mutation errors early (HIGH). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Supabase CLI (`supabase`) | Migrations, local stack, schema diff, generated DB types | Pin in devDependencies and use in CI for `db push` safety + type generation. Requires Node 20+ when run via npm/npx (HIGH). |
| `supabase gen types` + strict TS checks | Eliminate incomplete typing drift between DB and app | Generate `database.types.ts` on every schema change and fail CI on stale types/`tsc --noEmit` errors (HIGH). |
| EAS Workflows + Maestro | E2E quality gate on PRs with built app artifacts | Use for 1-2 critical flows first: auth entry, venue check-in with proximity denial/accept paths (HIGH). |
| pgTAP + Supabase DB advisors (`security` + `performance`) | Database-level quality gates | Add pgTAP tests for RLS policies and check-in SQL functions; run advisor review in release checklist (MEDIUM-HIGH). |

## Installation

```bash
# Core hardening additions
npm install @tanstack/react-query expo-network react-hook-form zod @hookform/resolvers @sentry/react-native

# Testing and quality gates
npm install -D jest jest-expo @types/jest @testing-library/react-native supabase
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| React Query for server state + Zustand for local state | Zustand-only for all state | Use Zustand-only only for very small apps with low async complexity; this codebase already has reliability/performance concerns that benefit from dedicated server-state tooling. |
| PostGIS + SQL/RPC distance checks | Client-side-only distance checks | Only acceptable for prototypes; not acceptable for trustable check-in because client GPS can be stale/spoofed and cannot enforce anti-abuse policy server-side. |
| Realtime Broadcast (topic-based) for high-fanout discovery updates + Postgres Changes for authoritative row events | Postgres Changes only | Use Postgres Changes only if fanout is small. Supabase documents single-thread processing and RLS authorization cost per subscriber, which becomes a bottleneck at scale. |
| EAS Workflows + Maestro for mobile E2E | Detox in this milestone | Consider Detox later if you move to custom dev builds and need deeper native instrumentation; current constraints favor EAS + Maestro. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Full state migration to Redux Toolkit now | High migration cost with little direct benefit vs current risks (typing, tests, check-in reliability). | Keep Zustand and add React Query for server state concerns. |
| Prisma/extra ORM layer on top of Supabase for app runtime | Adds another data abstraction and migration surface in a brownfield codebase with existing Supabase RPC patterns. | Keep direct Supabase client + SQL migrations + generated types. |
| Background geofencing as MVP check-in validator | Expo docs note platform limits and Expo Go limitations; adds permission/review complexity and weakens UX trust if overused. | On-demand foreground location validation + server-side PostGIS checks at check-in time. |
| Realtime without topic design and payload caps | Realtime limits/payload truncation can silently degrade UX at scale. | Per-venue topic partitioning, compact payloads, and explicit fallback polling for recovery. |

## Stack Patterns by Variant

**If current milestone (hardening existing app, low-to-mid scale):**
- Use PostGIS `geography(POINT)` + SQL function for check-in eligibility (`distance_meters`, freshness window, idempotency token).
- Keep Realtime subscriptions filtered by venue/table and use React Query invalidation as recovery path.

**If growth phase (high fanout discovery):**
- Use DB triggers + `realtime.broadcast_changes` to emit compact per-venue topic updates.
- Keep authoritative writes in Postgres, and send only incremental UI events over Broadcast.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `expo@~54.0.x` | `react-native@0.81.x`, `expo-router@6.x`, `jest-expo@54.x` | Stay within SDK-aligned versions to avoid native/runtime drift. |
| `@supabase/supabase-js@^2.95` | Supabase Realtime/Edge Functions current APIs | Includes modern Realtime/Broadcast capabilities and typed client improvements. |
| `@tanstack/react-query@^5.90` | React 19 + React Native | Use with mobile focus/online adapters (`AppState` + `expo-network`) for expected behavior. |
| `zod@^4` + `react-hook-form@^7.71` | TypeScript `~5.9` | Good fit for contract-driven validation without replacing existing simple-form patterns. |

## Sources

- https://docs.expo.dev/versions/latest/sdk/location/ - Location accuracy, geofencing limits, foreground/background constraints (HIGH)
- https://docs.expo.dev/develop/unit-testing/ - `jest-expo` and `@testing-library/react-native` recommendation; React 19 `react-test-renderer` deprecation note (HIGH)
- https://docs.expo.dev/router/reference/testing/ - Expo Router integration testing utilities (HIGH)
- https://docs.expo.dev/eas/workflows/examples/e2e-tests/ - EAS Workflows + Maestro E2E pattern (HIGH)
- https://docs.expo.dev/guides/using-sentry/ - Sentry integration for Expo/EAS Build/Update (HIGH)
- https://supabase.com/docs/guides/database/extensions/postgis - PostGIS geography/indexing and nearby/bounding-box query patterns (HIGH)
- https://supabase.com/docs/guides/realtime/postgres-changes - Postgres Changes behavior, scaling limitations, and guidance (HIGH)
- https://supabase.com/docs/guides/realtime/broadcast - Broadcast model, topicing, DB-triggered broadcast changes (HIGH)
- https://supabase.com/docs/guides/realtime/limits - Plan-level connection/message limits and payload constraints (HIGH)
- https://supabase.com/docs/guides/functions - Edge Functions runtime and operational guidance (HIGH)
- https://supabase.com/docs/guides/cron - Supabase Cron concurrency/runtime recommendations (HIGH)
- https://supabase.com/docs/guides/database/extensions/pgtap - Database unit testing for schema/RLS/functions (HIGH)
- https://supabase.com/docs/guides/api/rest/generating-types - TS type generation and automation from DB schema (HIGH)
- https://supabase.com/docs/guides/local-development/cli/getting-started - CLI installation/runtime requirements and workflow (HIGH)
- https://tanstack.com/query/latest/docs/framework/react/react-native - RN-specific online/focus integration patterns (MEDIUM-HIGH)

---
*Stack research for: Ta la (check-in reliability + nearby discovery hardening milestone)*
*Researched: 2026-02-10*
