# Architecture

## 1. Purpose

This document describes the current architecture of the Tá lá! codebase and the active technical/product constraints that shape implementation decisions.

## 2. System Overview

Tá lá! is a React Native mobile app built with Expo and Supabase.

- Frontend runtime: Expo SDK 54 + React Native 0.81
- Navigation: Expo Router (file-based routing in `app/`)
- State: Zustand stores + custom hooks
- Backend: Supabase Auth, Postgres, RPC, Realtime, Storage
- External venue provider: Google Places API (New)

## 3. High-Level Architecture

### 3.1 Layered structure

1. Route/UI layer (`app/`)
- Screens and navigation groups for auth, tabs, and profile routes.

2. Domain/UI component layer (`src/components/`)
- Reusable UI primitives and feature components.

3. Orchestration layer (`src/hooks/`)
- Feature hooks that coordinate state, services, and side effects.

4. Data/service layer (`src/services/`)
- Supabase and external API integrations, plus domain-side mapping.

5. Client state layer (`src/stores/`)
- Global state with Zustand (auth, location, check-in, venues, blocks, notifications).

6. Data contract/types (`src/types/`)
- Shared domain types and database-oriented TypeScript types.

### 3.2 Route architecture

Root routing entry:
- `app/_layout.tsx`: initializes theme and auth-based route protection.

Route groups:
- `app/(auth)/`: OTP login + onboarding flow.
- `app/(tabs)/`: main app tabs (`index`, `discover`, `profile`, `chat`; placeholder for `partners`).
- `app/user/[id].tsx`: public profile route outside tabs.

### 3.3 State architecture (Zustand)

Stores:
- `authStore`: session, user profile, onboarding draft state.
- `locationStore`: permission + location + dev GPS override.
- `checkInStore`: active check-in, denial reason, loading/error state.
- `venueStore`: venue list, location-aware cache metadata, selected venue.
- `blockStore`: blocked user IDs and hydration flag.
- `notificationStore`: notification preferences with optimistic updates.

### 3.4 Service architecture

Primary services:
- `supabase.ts`: single Supabase client instance.
- `auth.ts`: OTP send/verify + auth state subscription wrappers.
- `places.ts`: Google Places nearby search + normalization/scoring/filtering.
- `venueEnrichment.ts`: enriches venues with active user/open-to-meeting counts from Supabase.
- `interactions.ts`: interaction RPC workflows (`send_interaction`, `get_received_interactions`).
- `moderation.ts`: block/report operations.
- `notifications.ts`: notification preferences read/write.

### 3.5 Realtime architecture

Realtime is consumed via hooks:
- `useVenueRealtime`: subscribes to `check_ins` changes filtered by `venue_id`, then refetches roster.
- `useInteractionRealtime`: subscribes to `interactions` changes filtered by `venue_id`, then refetches received interactions.

Both use debounced callbacks and do not trust event payloads as the canonical source.

## 4. Core Functional Flows

### 4.1 Auth + onboarding

1. User requests OTP (`sendEmailVerification`).
2. User verifies OTP (`confirmEmailCode`).
3. Session updates via Supabase auth state listener.
4. App fetches profile from `users`.
5. If no profile, route guard directs user into onboarding.
6. Onboarding completion upserts `users`, inserts `interests`/`photos`.

### 4.2 Venue discovery + check-in

1. Location acquired from `expo-location` via `locationStore`.
2. Nearby places fetched from Google Places API.
3. Venues filtered/scored client-side and enriched with active counts from Supabase.
4. Check-in executed via server RPC (`check_in_to_place_v2`) with user coordinates.
5. Active check-in reflected in `checkInStore`.

### 4.3 Discovery + interactions

1. Current venue roster loaded via Supabase RPC (`get_users_at_venue`).
2. Search queries `users` with block-list filtering.
3. Interaction send uses RPC (`send_interaction`).
4. Received interactions loaded via RPC (`get_received_interactions`).
5. Realtime subscriptions trigger refetches for consistency.

### 4.4 Profile + moderation + preferences

- Profile editing updates `users` and `photos`.
- Moderation actions write to `blocks` and `reports`.
- Notification preferences read/write `notification_preferences`.

## 5. Data and Backend Boundaries

### 5.1 Supabase responsibilities

- Auth/session lifecycle (email OTP).
- Source of truth for users, check-ins, interactions, moderation data.
- RPC enforcement for trust-sensitive flows (check-in and interactions).
- Realtime event delivery for roster/interaction refresh triggers.
- Storage for profile photos (`avatars` bucket usage in app code).

### 5.2 Client responsibilities

- UI composition and route transitions.
- Local caching and global UI state.
- External venue fetching (Google Places), normalization, and display ranking.
- Permission handling and UX fallbacks.

## 6. Active Constraints

### 6.1 Technical constraints

- Expo SDK 54 + React Native 0.81.
- Expo Router only (do not migrate to React Navigation).
- Zustand for app state.
- Supabase for database/auth/realtime.
- HTTP client must be native `fetch` (no Axios).
- Location must use `expo-location`.
- TypeScript-first codebase.
- Build target: Expo Go / EAS Preview (no custom dev builds).

### 6.2 Product and scope constraints (MVP)

- In-scope:
  - Drink offers/interactions.
  - Venue check-in.
  - Discovery of users at the same venue.
  - In-app chat/messaging (text, emoji, photo, voice) per Spec 007.
- Check-in must enforce proximity/trust server-side (configured threshold in DB migrations).
- Out-of-scope for MVP:
  - Venue vibes/dating score features.

### 6.3 UX/content constraints

- All user-facing text must be pt-BR.
- Use project UI patterns/components from `src/components/ui/` when possible.
- Primary brand color: `#aeee5b`.

## 7. Quality and Operational Constraints

- Primary repository quality gate: `npm test` (`npm run lint` + `npm run typecheck`).
- ESLint configured via Expo flat config (`eslint-config-expo`).
- No dedicated automated unit/integration test suite is currently present.

## 8. Known Architectural Gaps

- `partners` tab is a placeholder; chat tab is implemented per Spec 007.
- Testing maturity is currently lint/typecheck-focused, without full automated functional suites.
- Some planning/spec directories exist outside runtime code and may diverge from implementation if not kept in sync.
