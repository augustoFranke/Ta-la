# Coding Conventions

**Analysis Date:** 2026-02-10

## Naming Patterns

**Files:**
- Use PascalCase for React component files in `src/components/ui/Button.tsx`, `src/components/profile/ProfileBioSection.tsx`, and `src/components/venue/VenueCard.tsx`.
- Use camelCase for hooks, services, stores, and config files in `src/hooks/useAuth.ts`, `src/services/places.ts`, `src/stores/locationStore.ts`, and `src/config/verifiedVenues.ts`.
- Use lowercase route file names and Expo Router dynamic segments in `app/(auth)/login.tsx`, `app/(tabs)/discover.tsx`, `app/venue/[id].tsx`, and `app/user/[id].tsx`.

**Functions:**
- Use camelCase for function names (`fetchUserProfile`, `sendOTP`, `checkInToPlace`) in `src/hooks/useAuth.ts` and `src/hooks/useCheckIn.ts`.
- Prefix hooks with `use` and export them as named functions (`useAuth`, `useVenues`, `useProfile`) in `src/hooks/useAuth.ts`, `src/hooks/useVenues.ts`, and `src/hooks/useProfile.ts`.
- Use `handle*` naming for UI event handlers (`handleSendOTP`, `handleToggleLocation`, `handleRespondDrink`) in `app/(auth)/login.tsx`, `app/(tabs)/profile/settings.tsx`, and `app/(tabs)/discover.tsx`.

**Variables:**
- Use camelCase for local variables and state (`isLoading`, `pendingEmail`, `searchQuery`) in `src/hooks/useAuth.ts`, `src/hooks/useProfile.ts`, and `app/(tabs)/discover.tsx`.
- Use UPPER_SNAKE_CASE for constants (`DEV_SKIP_AUTH`, `RADAR_BASE_URL`, `VENUE_CACHE_DURATION`) in `src/hooks/useAuth.ts`, `src/services/places.ts`, and `src/stores/venueStore.ts`.
- Keep DB field names in snake_case when mapping table columns (`birth_date`, `open_to_meeting`, `place_id`) in `src/types/database.ts`, `src/hooks/useCheckIn.ts`, and `src/hooks/useProfile.ts`.

**Types:**
- Use PascalCase for interfaces and type aliases (`AuthState`, `VenueWithDistance`, `DrinkRelation`) in `src/stores/authStore.ts`, `src/stores/venueStore.ts`, and `src/services/drinks.ts`.
- Keep union literals explicit for constrained domains (`Gender`, `GenderPreference`, `DrinkRelationState`) in `src/types/database.ts` and `src/services/drinks.ts`.
- Prefer `import type` for type-only imports as in `src/hooks/useAuth.ts`, `src/stores/authStore.ts`, and `src/components/profile/ProfileInterests.tsx`.

## Code Style

**Formatting:**
- Tool used: Not detected (`.prettierrc*` not present, `biome.json` not present).
- Keep 2-space indentation, semicolons, and single quotes, matching `app/(auth)/login.tsx` and `src/hooks/useAuth.ts`.
- Prefer trailing commas in multiline objects/arrays as in `src/hooks/useAuth.ts` and `app/(tabs)/discover.tsx`.

**Linting:**
- Tool used: Not detected (`.eslintrc*` and `eslint.config.*` not present).
- Enforce strict TypeScript via `"strict": true` in `tsconfig.json`.
- Avoid broad `any` casts; current exceptions appear in `app/(tabs)/index.tsx`, `src/hooks/useAuth.ts`, `src/hooks/useCheckIn.ts`, and `src/components/ui/Button.tsx`.

## Import Organization

**Order:**
1. React and framework imports first (`react`, `react-native`, `expo-router`) as in `app/(tabs)/discover.tsx`.
2. Third-party packages next (`@expo/vector-icons`, `expo-location`) as in `app/(tabs)/discover.tsx` and `app/(tabs)/profile/settings.tsx`.
3. Internal modules last with relative paths (`../../src/...`, `../services/...`) as in `app/(tabs)/index.tsx` and `src/hooks/useVenues.ts`.

**Path Aliases:**
- Not detected; use relative imports in `app/(auth)/verify.tsx`, `app/(tabs)/profile/index.tsx`, and `src/components/ui/Input.tsx`.

## Error Handling

**Patterns:**
- Wrap async IO in `try/catch/finally`, set loading state before/after, and return structured result objects (`{ success: boolean; error?: string }`) in `src/hooks/useAuth.ts`, `src/hooks/useCheckIn.ts`, and `src/hooks/useProfile.ts`.
- Throw early for invariant violations (`throw new Error(...)`) and convert to user-safe messages in `src/hooks/useAuth.ts` and `src/services/places.ts`.
- Surface operation errors in Zustand stores via `setError(...)` in `src/hooks/useVenues.ts`, `src/hooks/useCheckIn.ts`, and `src/stores/locationStore.ts`.

## Logging

**Framework:** console

**Patterns:**
- Use `console.error` for exception logging in hooks and services (`src/hooks/useAuth.ts`, `src/hooks/useProfile.ts`, `src/services/venueEnrichment.ts`, `src/services/places.ts`).
- Do not use `console.log`/`console.warn` in current application code under `src/`.

## Comments

**When to Comment:**
- Add file-level block comments for purpose/context in screens, hooks, and services (`app/_layout.tsx`, `app/(tabs)/index.tsx`, `src/services/auth.ts`, `src/hooks/useVenues.ts`).
- Add short section comments to partition UI blocks and state transitions in screens (`app/(tabs)/profile/index.tsx`, `app/(tabs)/discover.tsx`, `app/(auth)/login.tsx`).
- Keep comments explanatory for non-obvious logic (sorting/scoring/caching) as seen in `app/(tabs)/index.tsx`, `src/services/places.ts`, and `src/stores/venueStore.ts`.

**JSDoc/TSDoc:**
- Use JSDoc primarily in service and utility layers (`src/services/auth.ts`, `src/services/places.ts`, `src/services/venueEnrichment.ts`).
- Keep component props documented through TypeScript interfaces rather than JSDoc in `src/components/ui/Button.tsx` and `src/components/profile/ProfileBioSection.tsx`.

## Function Design

**Size:**
- Keep store actions and UI handlers small and focused (`src/stores/checkInStore.ts`, `app/(auth)/login.tsx`).
- Allow larger orchestration functions for data workflows in hooks/services (`src/hooks/useProfile.ts`, `src/services/places.ts`).

**Parameters:**
- Prefer typed object parameters for multi-field operations (`checkInToPlace(input)`, `sendDrinkOffer(params)`) in `src/hooks/useCheckIn.ts` and `src/services/drinks.ts`.
- Use optional options objects for hook configuration (`useVenues(options)`, `useProfile(options)`) in `src/hooks/useVenues.ts` and `src/hooks/useProfile.ts`.

**Return Values:**
- Return stable data/action objects from hooks (`useAuth`, `useVenues`, `useProfile`) in `src/hooks/useAuth.ts`, `src/hooks/useVenues.ts`, and `src/hooks/useProfile.ts`.
- Return explicit success/error payloads for mutating operations in `src/hooks/useAuth.ts`, `src/hooks/useCheckIn.ts`, and `src/services/auth.ts`.

## Module Design

**Exports:**
- Prefer named exports for hooks, services, and components (`export function ...`, `export const ...`) across `src/hooks/useAuth.ts`, `src/services/drinks.ts`, and `src/components/ui/Button.tsx`.
- Use default exports only for Expo Router route screens in `app/(auth)/login.tsx`, `app/(tabs)/discover.tsx`, and `app/venue/[id].tsx`.

**Barrel Files:**
- Use barrel exports for component groups in `src/components/profile/index.ts` and `src/components/venue/index.ts`.
- Import from barrels for grouped feature modules where available, e.g. `src/components/profile` in `app/(tabs)/profile/index.tsx` and `src/components/venue` in `app/(tabs)/index.tsx`.

---

*Convention analysis: 2026-02-10*
