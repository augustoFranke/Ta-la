# Codebase Structure

**Analysis Date:** 2026-02-10

## Directory Layout

```text
[project-root]/
|-- app/                     # Expo Router file-based routes and layout groups
|   |-- _layout.tsx          # Root providers + route guard
|   |-- (auth)/              # Authentication and onboarding route group
|   |   |-- _layout.tsx
|   |   |-- welcome.tsx
|   |   |-- login.tsx
|   |   |-- verify.tsx
|   |   `-- onboarding/
|   |       |-- _layout.tsx
|   |       |-- photos.tsx
|   |       |-- bio.tsx
|   |       |-- interests.tsx
|   |       |-- preferences.tsx
|   |       `-- permissions.tsx
|   |-- (tabs)/              # Main app tabs and nested profile stack
|   |   |-- _layout.tsx
|   |   |-- index.tsx
|   |   |-- discover.tsx
|   |   `-- profile/
|   |       |-- _layout.tsx
|   |       |-- index.tsx
|   |       `-- settings.tsx
|   |-- venue/               # Dynamic venue details route
|   |   `-- [id].tsx
|   |-- user/                # Dynamic public user profile route
|   |   `-- [id].tsx
|   `-- chat/                # Reserved route directory (no files currently)
|-- src/
|   |-- components/          # Shared UI + feature components
|   |   |-- ui/              # Button, Input, Card, Avatar, Tag primitives
|   |   |-- common/          # Cross-feature pieces (OnboardingProgress)
|   |   |-- venue/           # Venue-specific components + barrel
|   |   |-- profile/         # Profile-specific components + barrel
|   |   `-- chat/            # Reserved component directory (no files currently)
|   |-- config/              # Local scoring/curation constants
|   |-- hooks/               # Business-flow hooks
|   |-- lib/                 # Reserved utility directory (no files currently)
|   |-- services/            # External API/Supabase adapters
|   |-- stores/              # Zustand stores
|   |-- theme/               # Theme provider and design tokens
|   `-- types/               # Domain and DB typings
|-- supabase/
|   |-- migrations/          # SQL schema/RLS/functions evolution
|   |-- functions/           # Reserved edge function directory (no files currently)
|   `-- .temp/               # Supabase CLI generated temp metadata
|-- assets/                  # App icons/splash assets
|-- ios/                     # Native iOS project files
|-- dist/                    # Build artifacts (web export)
|-- package.json             # Scripts, dependencies, entrypoint
|-- app.json                 # Expo runtime configuration
`-- tsconfig.json            # TypeScript config
```

## Directory Purposes

**`app/`:**
- Purpose: Route-first UI composition and navigation hierarchy.
- Contains: Expo Router layouts (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(auth)/_layout.tsx`) and screen files (`app/(tabs)/discover.tsx`, `app/venue/[id].tsx`, `app/user/[id].tsx`).
- Key files: `app/_layout.tsx`, `app/(auth)/onboarding/_layout.tsx`, `app/(tabs)/profile/_layout.tsx`.

**`src/components/`:**
- Purpose: Reusable presentational blocks.
- Contains: Low-level UI primitives in `src/components/ui/*.tsx`, feature components in `src/components/venue/*.tsx` and `src/components/profile/*.tsx`, shared onboarding indicator in `src/components/common/OnboardingProgress.tsx`.
- Key files: `src/components/ui/Button.tsx`, `src/components/venue/VenueCarousel.tsx`, `src/components/profile/ProfilePhotos.tsx`.

**`src/hooks/`:**
- Purpose: Encapsulate domain workflows and async orchestration.
- Contains: `src/hooks/useAuth.ts`, `src/hooks/useVenues.ts`, `src/hooks/useCheckIn.ts`, `src/hooks/useProfile.ts`.
- Key files: `src/hooks/useAuth.ts`, `src/hooks/useVenues.ts`, `src/hooks/useCheckIn.ts`.

**`src/services/`:**
- Purpose: API/database and integration boundaries.
- Contains: Supabase client/auth wrappers (`src/services/supabase.ts`, `src/services/auth.ts`), venue search/filtering (`src/services/places.ts`), venue enrichment (`src/services/venueEnrichment.ts`), drink offers (`src/services/drinks.ts`).
- Key files: `src/services/supabase.ts`, `src/services/places.ts`, `src/services/drinks.ts`.

**`src/stores/`:**
- Purpose: Cross-screen client state with Zustand.
- Contains: `src/stores/authStore.ts`, `src/stores/locationStore.ts`, `src/stores/venueStore.ts`, `src/stores/checkInStore.ts`.
- Key files: `src/stores/authStore.ts`, `src/stores/locationStore.ts`, `src/stores/venueStore.ts`.

**`src/theme/`:**
- Purpose: Runtime theming and token source of truth.
- Contains: Theme context and persistence (`src/theme/index.ts`) plus token files (`src/theme/colors.ts`, `src/theme/spacing.ts`, `src/theme/typography.ts`).
- Key files: `src/theme/index.ts`, `src/theme/colors.ts`.

**`src/config/`:**
- Purpose: Domain constants and curation lists for venue ranking.
- Contains: `src/config/verifiedVenues.ts`, `src/config/venueTypeScores.ts`.
- Key files: `src/config/verifiedVenues.ts`, `src/config/venueTypeScores.ts`.

**`src/types/`:**
- Purpose: Shared TypeScript domain and schema interfaces.
- Contains: `src/types/database.ts`.
- Key files: `src/types/database.ts`.

**`supabase/migrations/`:**
- Purpose: Database schema, RLS, triggers, and SQL function history.
- Contains: Ordered migrations from `supabase/migrations/001_enable_extensions.sql` through `supabase/migrations/019_fix_venue_metadata_rls_v2.sql`.
- Key files: `supabase/migrations/011_create_functions.sql`, `supabase/migrations/013_create_storage_buckets.sql`, `supabase/migrations/017_create_venue_filtering.sql`.

## Key File Locations

**Entry Points:**
- `package.json`: Sets runtime entry (`expo-router/entry`) and npm scripts.
- `app/_layout.tsx`: Global providers and auth/onboarding route redirection.
- `app/(tabs)/index.tsx`: Main signed-in home entry.

**Configuration:**
- `app.json`: Expo app config (permissions, plugins, platform metadata).
- `tsconfig.json`: TypeScript strict mode baseline.
- `src/theme/colors.ts`: App color system.

**Core Logic:**
- `src/hooks/useAuth.ts`: Auth/session onboarding orchestration.
- `src/hooks/useVenues.ts`: Venue discovery orchestration and cache checks.
- `src/services/places.ts`: Radar Places fetch + filtering + mapping.
- `src/services/drinks.ts`: Drink relation state engine.

**Testing:**
- Not detected in repository (`*.test.*` and `*.spec.*` files are absent).

## Naming Conventions

**Files:**
- Route files use Expo Router conventions: `_layout.tsx` for group layouts and `[id].tsx` for dynamic segments (`app/venue/[id].tsx`, `app/user/[id].tsx`).
- React component files use PascalCase (`src/components/ui/Button.tsx`, `src/components/venue/VenueCard.tsx`).
- Hook files use `useX.ts` naming (`src/hooks/useAuth.ts`, `src/hooks/useProfile.ts`).
- Store files use camelCase + `Store.ts` suffix (`src/stores/authStore.ts`, `src/stores/venueStore.ts`).
- Service/config/type files use lower camelCase or lowercase nouns (`src/services/venueEnrichment.ts`, `src/config/verifiedVenues.ts`, `src/types/database.ts`).

**Directories:**
- Route groups are wrapped in parentheses (`app/(auth)`, `app/(tabs)`).
- Feature component directories are noun-based (`src/components/venue`, `src/components/profile`).
- Layer directories follow architecture role names (`src/hooks`, `src/services`, `src/stores`, `src/theme`, `src/config`, `src/types`).

## Where to Add New Code

**New Feature:**
- Primary code: Add route screen in `app/` if it is navigation-facing; place reusable logic in `src/hooks/` and `src/services/`.
- Tests: Not applicable in current state; establish a test directory pattern first (for example `src/**/__tests__/`) before adding feature tests.

**New Component/Module:**
- Implementation: Add shared primitives to `src/components/ui/`; add feature-scoped components to `src/components/venue/` or `src/components/profile/`; add barrel export in `src/components/venue/index.ts` or `src/components/profile/index.ts` when applicable.

**Utilities:**
- Shared helpers: Put domain constants in `src/config/`; put domain type contracts in `src/types/database.ts`; add new external adapter logic in `src/services/`.

## Special Directories

**`supabase/.temp/`:**
- Purpose: Supabase CLI-generated environment metadata (`project-ref`, version markers).
- Generated: Yes.
- Committed: Yes (present in repository).

**`app/chat/`:**
- Purpose: Reserved route space for chat flows.
- Generated: No.
- Committed: Yes (directory exists, no route file yet).

**`src/components/chat/`:**
- Purpose: Reserved component space for chat UI.
- Generated: No.
- Committed: Yes (directory exists, no component file yet).

**`src/lib/`:**
- Purpose: Reserved generic utility directory.
- Generated: No.
- Committed: Yes (directory exists, no file yet).

**`supabase/functions/`:**
- Purpose: Reserved edge function source directory.
- Generated: No.
- Committed: Yes (directory exists, no function file yet).

---

*Structure analysis: 2026-02-10*
