# Architecture

**Analysis Date:** 2026-02-10

## Pattern Overview

**Overall:** Route-first feature architecture with thin service/hooks/store layers around Supabase and device APIs.

**Key Characteristics:**
- Expo Router drives screen composition from `app/` while business logic lives under `src/` (`app/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(auth)/login.tsx`).
- Custom hooks orchestrate async flows and aggregate state from Zustand stores plus service calls (`src/hooks/useAuth.ts`, `src/hooks/useVenues.ts`, `src/hooks/useCheckIn.ts`, `src/hooks/useProfile.ts`).
- Services are explicit boundary modules for external systems (Supabase, Google Places API New), keeping transport and mapping logic out of UI files (`src/services/supabase.ts`, `src/services/auth.ts`, `src/services/places.ts`, `src/services/venueEnrichment.ts`, `src/services/drinks.ts`).

## Layers

**Navigation & Screen Layer:**
- Purpose: Define route tree, screen transitions, and route guards.
- Location: `app/` (root at `app/_layout.tsx`, groups in `app/(auth)/`, `app/(tabs)/`, dynamic routes in `app/user/[id].tsx`).
- Contains: Expo Router layouts, tab stacks, screen-level UI composition, local screen state.
- Depends on: Hooks and shared UI components from `src/`.
- Used by: End users through route resolution from `expo-router/entry` (`package.json`).

**Hook Orchestration Layer:**
- Purpose: Coordinate view-model logic, async calls, and store updates for screens.
- Location: `src/hooks/`.
- Contains: Auth lifecycle and onboarding submit (`src/hooks/useAuth.ts`), venue fetching/cache control (`src/hooks/useVenues.ts`), check-in lifecycle (`src/hooks/useCheckIn.ts`), profile data sync (`src/hooks/useProfile.ts`).
- Depends on: `src/services/*`, `src/stores/*`, `src/types/database.ts`.
- Used by: Screen files in `app/`.

**State Layer (Client Store):**
- Purpose: Keep cross-screen client state stable across navigation transitions.
- Location: `src/stores/`.
- Contains: Session/onboarding draft (`src/stores/authStore.ts`), permission/location coordinates (`src/stores/locationStore.ts`), venue list/cache/selection (`src/stores/venueStore.ts`), active check-in snapshot (`src/stores/checkInStore.ts`).
- Depends on: Zustand and domain types.
- Used by: Hooks and directly by some screens (`app/(tabs)/index.tsx`, `app/(tabs)/profile/settings.tsx`).

**Service & Integration Layer:**
- Purpose: Encapsulate all database/API side effects and response transformation.
- Location: `src/services/`.
- Contains: Supabase client bootstrap (`src/services/supabase.ts`), auth helpers (`src/services/auth.ts`), Google Places API (New) fetch + strict Field Masking + mapping (`src/services/places.ts`), Supabase enrichment joins (`src/services/venueEnrichment.ts`), drink/match relation resolution (`src/services/drinks.ts`).
- Depends on: Runtime env vars and remote APIs.
- Used by: Hooks and a few direct screen calls (`app/(tabs)/discover.tsx`, `app/user/[id].tsx`).

**Presentation & Design System Layer:**
- Purpose: Provide reusable themed primitives and feature components.
- Location: `src/components/` and `src/theme/`.
- Contains: Base controls (`src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Avatar.tsx`, `src/components/ui/Tag.tsx`), feature widgets (`src/components/venue/*`, `src/components/profile/*`), theme context/tokens (`src/theme/index.ts`, `src/theme/colors.ts`, `src/theme/spacing.ts`, `src/theme/typography.ts`).
- Depends on: React Native primitives and `useTheme`.
- Used by: All route screens.

**Data Platform Layer (Schema/RLS/Functions):**
- Purpose: Persist domain data, enforce access policies, and execute server-side logic.
- Location: `supabase/migrations/*.sql`.
- Contains: Core tables (`supabase/migrations/002_create_users.sql`, `supabase/migrations/005_create_venues.sql`, `supabase/migrations/006_create_check_ins.sql`, `supabase/migrations/007_create_drinks.sql`, `supabase/migrations/008_create_matches.sql`), storage policy (`supabase/migrations/013_create_storage_buckets.sql`), RPC/trigger logic (`supabase/migrations/011_create_functions.sql`, `supabase/migrations/017_create_venue_filtering.sql`).
- Depends on: Postgres + Supabase Auth context (`auth.uid()`, `auth.role()`).
- Used by: Client via Supabase table queries and RPC calls.

## Data Flow

**App Bootstrap and Route Gating:**

1. `app/_layout.tsx` mounts `ThemeProvider`, calls `useAuth()`, and waits for auth initialization.
2. `src/hooks/useAuth.ts` subscribes to `onAuthStateChanged()` from `src/services/auth.ts` and stores session/user in `src/stores/authStore.ts`.
3. `app/_layout.tsx` inspects `session`, `isAuthenticated`, and `needsOnboarding` and redirects to `/(auth)/welcome`, `/(auth)/onboarding/photos`, or `/(tabs)`.

**Nearby Venue Discovery:**

1. `app/(tabs)/index.tsx` triggers location bootstrap through `src/stores/locationStore.ts` and consumes `useVenues()`.
2. `src/hooks/useVenues.ts` calls `searchNearbyVenues()` in `src/services/places.ts` (Google Places API New) and enriches results with `enrichWithActiveUserCounts()` in `src/services/venueEnrichment.ts`.
3. Results are cached in `src/stores/venueStore.ts` with aggressive persistence; UI renders via `src/components/venue/VenueCarousel.tsx` directly on the home screen.

**Check-in and Discover People:**

1. User submits check-in intent through `useCheckIn().checkInToPlace()` directly from a venue card on the home screen.
2. Hook invokes Supabase RPC `check_in_to_place` and refreshes active check-in from `check_ins` table.
3. `app/(tabs)/discover.tsx` reads active check-in and loads users in the same venue via Supabase RPC `get_users_at_venue` (defined in `supabase/migrations/011_create_functions.sql`), then resolves drink state through `src/services/drinks.ts`.

**State Management:**
- Global state uses scoped Zustand stores per domain (`src/stores/authStore.ts`, `src/stores/locationStore.ts`, `src/stores/venueStore.ts`, `src/stores/checkInStore.ts`).
- Screen-local ephemeral UI state remains in `useState` inside route files (`app/(tabs)/discover.tsx`, `app/(auth)/verify.tsx`, `app/(auth)/onboarding/preferences.tsx`).

## Key Abstractions

**Route Group Gatekeeping:**
- Purpose: Segment auth and app routes while centralizing access rules.
- Examples: `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(auth)/onboarding/_layout.tsx`, `app/(tabs)/_layout.tsx`.
- Pattern: Root guard + nested route groups with no duplicate auth logic in child screens.

**Domain Hooks as Use Cases:**
- Purpose: Treat each business workflow as a hook-level use case API.
- Examples: `src/hooks/useAuth.ts` (`sendOTP`, `verifyOTP`, `completeOnboarding`), `src/hooks/useCheckIn.ts` (`checkInToPlace`), `src/hooks/useVenues.ts` (`refreshVenues`), `src/hooks/useProfile.ts` (`updatePhotos`, `updateInterests`).
- Pattern: Hook exposes serializable state + imperative async actions.

**Provider Adapters:**
- Purpose: Normalize third-party payloads into app domain models.
- Examples: Google Places mapping in `src/services/places.ts` (`transformToVenue`), count enrichment in `src/services/venueEnrichment.ts`.
- Pattern: Service functions return typed domain-oriented objects consumed by hooks/stores.

**Feature Component Modules:**
- Purpose: Keep complex screen sections reusable and isolated.
- Examples: Venue module (`src/components/venue/VenueCard.tsx`, `src/components/venue/VenueCarousel.tsx`, `src/components/venue/CheckInModal.tsx`) and profile module (`src/components/profile/ProfileHeader.tsx`, `src/components/profile/ProfilePhotos.tsx`, `src/components/profile/ProfileBioSection.tsx`, `src/components/profile/ProfileInterests.tsx`).
- Pattern: Feature folders with barrel exports (`src/components/venue/index.ts`, `src/components/profile/index.ts`).

## Entry Points

**App Runtime Entry:**
- Location: `package.json` (`"main": "expo-router/entry"`).
- Triggers: Expo app startup.
- Responsibilities: Boot Expo Router tree from `app/`.

**Global Layout / Router Guard:**
- Location: `app/_layout.tsx`.
- Triggers: Every route resolution.
- Responsibilities: Provide theme + safe area context, run protected route logic, register stack screens, and gate auth/onboarding.

**Auth Flow Entry:**
- Location: `app/(auth)/welcome.tsx` and `app/(auth)/login.tsx`.
- Triggers: Unauthenticated or signed-out state.
- Responsibilities: Start OTP flow and route to `app/(auth)/verify.tsx`.

**Main Product Entry:**
- Location: `app/(tabs)/index.tsx`.
- Triggers: Authenticated + onboarded users.
- Responsibilities: Kick off location + venue discovery via home screen cards.

**Data Definition Entry:**
- Location: `supabase/migrations/` (ordered SQL files).
- Triggers: Supabase migration application.
- Responsibilities: Define schema, RLS policies, DB functions, and storage permissions.

## Error Handling

**Strategy:** Catch-and-return at hook/service boundaries with UI feedback via `Alert.alert` and store-level `error` fields.

**Patterns:**
- Services return `{ data/error }` style semantics and hooks translate failures to user-facing messages (`src/services/places.ts`, `src/hooks/useVenues.ts`, `src/hooks/useCheckIn.ts`, `src/hooks/useAuth.ts`).
- Screens handle recoverable failures inline (retry buttons, disabled actions, empty states) instead of throwing to a global boundary (`src/components/venue/VenueCarousel.tsx`, `app/(tabs)/discover.tsx`, `app/(auth)/verify.tsx`).

## Cross-Cutting Concerns

**Logging:** Console logging is used for diagnostics in hooks/services (`src/hooks/useAuth.ts`, `src/hooks/useCheckIn.ts`, `src/hooks/useProfile.ts`, `src/services/places.ts`).
**Validation:** Input validation is local to screens/hooks (email and OTP checks in `app/(auth)/login.tsx` and `app/(auth)/verify.tsx`, onboarding validation in `app/(auth)/onboarding/bio.tsx`, UUID checks in `src/hooks/useProfile.ts`).
**Authentication:** Supabase Auth session drives all protected access; route gating is centralized in `app/_layout.tsx`, while DB access is enforced by RLS in `supabase/migrations/*.sql`.

---

*Architecture analysis: 2026-02-16*
