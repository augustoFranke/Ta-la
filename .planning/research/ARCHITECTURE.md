# Architecture Research

**Domain:** Brownfield Expo + Supabase location-social app (check-in and discovery loop)
**Researched:** 2026-02-10
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Route + Presentation Layer                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  app/(tabs)/index.tsx   app/venue/[id].tsx   app/(tabs)/discover.tsx       │
│          │                      │                      │                     │
├──────────┴──────────────────────┴──────────────────────┴─────────────────────┤
│                    Feature Orchestration (Hooks)                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ useVenues()            useCheckIn()             useDiscovery() [add]        │
│ useLocation() [add]    useRealtimePresence() [add]                          │
├──────────────────────────────────────────────────────────────────────────────┤
│               Domain + State Boundary (Stores + DTOs)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ venueStore             checkInStore            discoveryStore [add]          │
│ locationStore          authStore               types/database.ts             │
├──────────────────────────────────────────────────────────────────────────────┤
│                   Integration/Infra Adapters Layer                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ services/places.ts     services/venueEnrichment.ts      services/supabase.ts │
│ services/checkins.ts [add]  services/discovery.ts [add]  telemetry/* [add]  │
├──────────────────────────────────────────────────────────────────────────────┤
│               Supabase Data and Policy Enforcement Layer                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ tables (check_ins, venues, users, drinks, ...)                              │
│ RPC/functions (check_in_to_place [missing migration], get_users_at_venue)   │
│ RLS policies, indexes, realtime publication, cron jobs                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `app/*` route screens | Render UI, capture user intent, navigate | Expo Router route files with no direct persistence logic |
| Feature hooks (`useCheckIn`, `useVenues`, new `useDiscovery`) | Orchestrate use-cases and side effects | Async command/query methods, cancellation guards, stable return shape |
| Zustand stores | Hold client cache and UI-facing state only | Minimal mutations, normalized IDs, stale/loading/error metadata |
| Service adapters | Talk to external systems (Supabase, Radar, telemetry) | Typed request/response mappers + retry/backoff policies |
| Database RPC/functions | Enforce invariants and trust boundaries | PL/pgSQL with transaction-safe checks, explicit grants, index-backed filters |
| RLS + SQL schema | Authorization and data visibility constraints | RLS policies with `TO authenticated`, indexed policy columns |
| Realtime worker boundary | Push incremental updates to clients | Filtered Postgres Changes channels + store patching |
| Observability boundary | Emit failures, latency, and business events | Sentry on client + Postgres logs + pg_stat_statements + cron history |

## Recommended Project Structure

```
app/
├── (tabs)/index.tsx                  # Home/discovery entry route
├── (tabs)/discover.tsx               # Discovery route shell
└── venue/[id].tsx                    # Check-in route shell

src/
├── features/
│   ├── checkin/
│   │   ├── hook.ts                   # useCheckIn use-case orchestration
│   │   ├── service.ts                # check-in command/query adapter
│   │   ├── store.ts                  # check-in cached state
│   │   └── types.ts                  # DTOs and command payloads
│   ├── discovery/
│   │   ├── hook.ts                   # useDiscovery orchestration
│   │   ├── service.ts                # nearby users + counts queries
│   │   ├── realtime.ts               # channel bindings and patch handlers
│   │   └── store.ts                  # discovery list/cache state
│   └── venues/
│       ├── hook.ts                   # useVenues orchestration
│       ├── service.ts                # Radar + enrichment composition
│       └── store.ts                  # venues cache state
├── services/
│   ├── supabase.ts                   # typed client singleton
│   ├── places.ts                     # Radar adapter only
│   └── telemetry/
│       ├── errors.ts                 # Sentry capture wrappers
│       └── metrics.ts                # latency and outcome events
├── types/
│   ├── database.generated.ts         # generated from Supabase schema
│   └── database.ts                   # local type overrides only
└── stores/                           # keep for shared cross-feature stores only

supabase/
├── migrations/
│   ├── 0xx_create_check_in_contract.sql
│   ├── 0xx_add_geospatial_indexes.sql
│   ├── 0xx_add_discovery_read_model.sql
│   └── 0xx_add_observability_helpers.sql
└── tests/database/
    ├── check_in_contract.test.sql
    ├── check_in_rls.test.sql
    └── discovery_visibility.test.sql
```

### Structure Rationale

- **`app/` stays route-first:** keep Expo Router as composition shell; do not let route files own persistence.
- **`src/features/*` becomes ownership boundary:** each loop (venues, check-in, discovery) has explicit hook/service/store/types ownership.
- **`src/services/*` remains integration-only:** adapters must not hold business invariants; invariants move to RPC + SQL policies.
- **`supabase/migrations` + `supabase/tests/database` become release gate:** brownfield risk (missing DB artifacts) is solved by migration-first and SQL contract tests.

## Architectural Patterns

### Pattern 1: Route -> Hook -> Service -> RPC Command Pipeline

**What:** Keep route components thin and call a single command method on a feature hook. The hook calls service adapters and one authoritative RPC for mutation.
**When to use:** Every state-changing action (`check_in`, `checkout`, drink send/accept) where idempotency and invariants matter.
**Trade-offs:** Slightly more boilerplate; far fewer hidden side effects and safer rollback behavior.

**Example:**
```typescript
// app/venue/[id].tsx (route shell)
const { commandCheckIn } = useCheckInFeature();
await commandCheckIn({ venuePlaceId, openToMeeting, deviceLocation });

// src/features/checkin/hook.ts
export async function commandCheckIn(input: CheckInCommand) {
  store.setPending('checkin');
  const result = await checkInService.execute(input); // one RPC entrypoint
  store.applyCheckInResult(result);
}
```

### Pattern 2: Server-Authoritative Check-In Validation

**What:** Client may suggest location and venue, but DB function validates all invariants and decides final check-in outcome.
**When to use:** Proximity validation, one-active-check-in rule, TTL and anti-spoof checks.
**Trade-offs:** More SQL complexity; much better trust boundary and abuse resistance.

**Example:**
```sql
create or replace function public.check_in_to_place_v2(
  p_place_id text,
  p_device_lat double precision,
  p_device_lng double precision,
  p_device_accuracy_m double precision,
  p_open_to_meeting boolean
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_venue_id uuid;
begin
  -- upsert venue and validate distance in-db (PostGIS ST_DWithin)
  -- deactivate previous active check-in atomically
  -- insert new active row and return id
  return v_venue_id;
end;
$$;
```

### Pattern 3: CQRS-lite for Discovery Read Models

**What:** Separate write model (`check_ins`) from read model optimized for discovery list and counts (`active_presence_snapshot` view/table).
**When to use:** Discovery list refresh, venue counts, and "people here now" screens.
**Trade-offs:** Extra migration and sync logic; lower query cost and simpler app reads at scale.

**Example:**
```typescript
// query side
const users = await discoveryService.listVenueUsers({ venueId, limit: 50 });

// realtime patch side
realtime.onPresenceDelta((delta) => discoveryStore.applyDelta(delta));
```

### Pattern 4: Reliability Envelope Around Network Calls

**What:** Every adapter call returns `{ data, error, retryable, latencyMs, correlationId }` and hooks apply consistent retry rules.
**When to use:** Radar lookup, Supabase RPC, realtime reconnection.
**Trade-offs:** More structured result objects; easier incident debugging and safer retries.

## Data Flow

### Request Flow (Check-In)

```
[Tap "Fazer check-in"]
    ↓
[app/venue/[id].tsx]
    ↓ intent
[useCheckInFeature.commandCheckIn]
    ↓ command
[checkin service adapter]
    ↓ RPC
[Supabase function check_in_to_place_v2]
    ↓ transaction + RLS + indexes
[check_ins / venues]
    ↓
[result DTO]
    ↓
[checkIn store update]
    ↓
[UI + navigation to discover]
```

### Request Flow (Discovery)

```
[app/(tabs)/discover.tsx]
    ↓
[useDiscovery.queryVenueUsers]
    ↓
[discovery service]
    ↓
[RPC/view: venue users + similarity + drink state]
    ↓
[discovery store normalized entities]
    ↓
[render cards]
```

### Realtime Flow (Incremental Updates)

```
[check_ins INSERT/UPDATE]
    ↓ publication: supabase_realtime
[filtered channel subscription]
    ↓
[realtime adapter]
    ↓
[store patch by entity id]
    ↓
[hook selectors]
    ↓
[screen rerender]
```

### Trust Boundaries (Explicit)

1. **Device -> App code:** untrusted user input (location, open_to_meeting, venue id).
2. **App -> Supabase RPC:** authenticated but still untrusted payload.
3. **RPC + RLS boundary (source of truth):** enforce proximity, one-active-check-in, visibility, and expiration.
4. **Realtime delivery boundary:** only subscribe with table/topic filters and policies that match visibility rules.

### Key Data Flows

1. **Venue discovery flow:** `locationStore` -> `places service (Radar)` -> `enrichment RPC/read model` -> `venueStore`.
2. **Check-in command flow:** `venue detail route` -> `check-in command` -> `RPC transaction` -> `checkInStore` -> `discover route`.
3. **Presence refresh flow:** `check_ins mutation` -> `Realtime/Postgres changes` -> `discovery store patch`.
4. **Observability flow:** `hook/service failure` -> `Sentry event + correlation id` -> `Postgres logs + pg_stat_statements`.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Keep monolith (Expo + Supabase). Prioritize migration completeness, RLS correctness, and typed contracts. |
| 1k-100k users | Add PostGIS index-backed distance checks, read-model for discovery counts, filtered realtime subscriptions, and cron cleanup jobs. |
| 100k+ users | Split hot discovery read path into dedicated aggregated tables/materialized views, minimize per-user Postgres Changes fan-out, and consider Broadcast re-streaming strategy. |

### Scaling Priorities

1. **First bottleneck: discovery fan-out + RLS checks on realtime.** Fix with narrow subscriptions, denormalized read model, and fewer broad channels.
2. **Second bottleneck: expensive proximity and similarity queries.** Fix with PostGIS/geospatial indexes and precomputed similarity inputs.

## Anti-Patterns

### Anti-Pattern 1: Route Files Calling Supabase Directly

**What people do:** Query/mutate Supabase inside route components (`discover.tsx` currently does this).
**Why it is wrong:** Duplicated business logic, inconsistent retries/errors, and untestable side effects.
**Do this instead:** Route -> feature hook -> typed service -> RPC/view only.

### Anti-Pattern 2: Client-Only Proximity Enforcement

**What people do:** Block check-in in UI by distance and assume security is solved.
**Why it is wrong:** Client checks are bypassable; spoofed payloads can still hit RPC.
**Do this instead:** Keep UI check for UX, but enforce distance and rule checks in DB function.

### Anti-Pattern 3: SQL Objects Created Outside Migrations

**What people do:** Create or edit DB functions in dashboard only.
**Why it is wrong:** Drift between environments; missing artifacts break deploys and rollbacks.
**Do this instead:** Migration-first SQL + db tests + generated types update in CI.

### Anti-Pattern 4: Shared Global Store for Unrelated Domains

**What people do:** Keep discovery, check-in, and venue state in one mutable store.
**Why it is wrong:** Cross-feature coupling and noisy rerenders.
**Do this instead:** Feature-bounded stores with selectors and explicit bridge actions.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth/DB | Typed `supabase-js` client + RPC/view calls | Use generated DB types and avoid `any` in payload mappings. |
| Supabase Realtime | Filtered `postgres_changes` subscriptions per table + venue scope | Official docs warn about scale and per-subscriber authorization cost. |
| Radar Places API | Adapter only in `services/places.ts` | Keep provider-specific fields out of stores/routes; map into internal DTO. |
| Sentry (Expo) | Early app init + route/user tags + error capture wrappers | Expo guide supports EAS Build/Update and source map upload flows. |
| Supabase Cron (`pg_cron`) | Schedule DB function and cleanup tasks | Use for auto-checkout execution and stale read-model maintenance. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app/*` <-> `src/features/*` | Hook API (commands + queries) | No raw Supabase client usage in routes. |
| `src/features/*` <-> `src/services/*` | Typed adapter interfaces | Services return structured result envelopes. |
| `src/services/*` <-> Supabase SQL | RPC, views, filtered selects | SQL owns invariants; JS owns orchestration and retries. |
| `supabase/migrations/*` <-> CI | `supabase db` + SQL tests + type generation | Build fails on schema drift or broken contract. |

## Build Order and Dependency Implications

1. **Phase A: Contract and trust-boundary hardening (must be first)**
   - Create migrations for all missing SQL artifacts (especially `check_in_to_place`).
   - Add generated DB types and remove `any` from check-in/discovery paths.
   - Add SQL tests for function existence, RLS behavior, and one-active-check-in constraint.
   - **Dependency:** Every later phase assumes stable, versioned DB contracts.

2. **Phase B: Check-in reliability core**
   - Introduce `check_in_to_place_v2` with server-authoritative validation and atomic transitions.
   - Add/verify indexes for active check-in lookups and proximity checks.
   - Schedule auto-checkout with Supabase Cron and monitor job history.
   - **Dependency:** Requires Phase A migrations + tests in place.

3. **Phase C: Discovery read-model and scalable query path**
   - Add discovery-specific service/hook/store boundaries (`useDiscovery`).
   - Move broad screen-level queries into RPC/view-backed read model.
   - Wire filtered realtime updates to patch stores incrementally.
   - **Dependency:** Requires reliable check-in writes from Phase B.

4. **Phase D: Observability and operability**
   - Add Sentry route/action instrumentation and correlation IDs.
   - Add DB-level logs in critical functions and pg_stat_statements review routine.
   - Define SLOs (check-in success rate, p95 check-in latency, discovery refresh latency) and alert thresholds.
   - **Dependency:** Needs stable command/query paths from Phases B-C.

5. **Phase E: Performance tuning and load-proofing**
   - Benchmark RLS + realtime fan-out behavior using production-like filters.
   - Promote hot reads to denormalized/materialized structures only where needed.
   - Revisit channel topology if throughput or join latency degrades.
   - **Dependency:** Requires observability baseline from Phase D.

## Sources

- Expo Router introduction and route model (official): https://docs.expo.dev/router/introduction/
- Expo Location API, permissions, and `LocationObjectCoords.mocked` field (official): https://docs.expo.dev/versions/latest/sdk/location/
- Expo Sentry integration with EAS Build/Update (official): https://docs.expo.dev/guides/using-sentry/
- Supabase database functions and security definer/invoker guidance (official): https://supabase.com/docs/guides/database/functions
- Supabase RLS policies and performance recommendations (official): https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Realtime Postgres Changes scaling limitations and filtering (official): https://supabase.com/docs/guides/realtime/postgres-changes
- Supabase Realtime authorization and private channels (official): https://supabase.com/docs/guides/realtime/authorization
- Supabase PostGIS extension and geospatial index patterns (official): https://supabase.com/docs/guides/database/extensions/postgis
- Supabase Cron module + quickstart (`pg_cron`, `cron.schedule`) (official): https://supabase.com/docs/guides/cron and https://supabase.com/docs/guides/cron/quickstart
- Supabase DB testing with CLI + pgTAP (official): https://supabase.com/docs/guides/database/testing
- Supabase debugging/monitoring and `pg_stat_statements` usage (official): https://supabase.com/docs/guides/database/inspect and https://supabase.com/docs/guides/database/extensions/pg_stat_statements
- Supabase generated TypeScript types for DB schema contracts (official): https://supabase.com/docs/guides/api/rest/generating-types

---
*Architecture research for: brownfield check-in/discovery evolution in Expo + Supabase*
*Researched: 2026-02-10*
