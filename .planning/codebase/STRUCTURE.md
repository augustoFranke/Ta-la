# Codebase Structure

**Analysis Date:** 2026-02-10

## Directory Layout

```
ta-la-app/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (auth)/            # Authentication flow (group route)
│   │   ├── onboarding/    # Multi-step onboarding screens
│   │   ├── _layout.tsx    # Auth stack navigator
│   │   ├── welcome.tsx    # Welcome/splash screen
│   │   ├── login.tsx      # Email entry for OTP
│   │   └── verify.tsx     # OTP verification
│   ├── (tabs)/            # Main app tab navigation (group route)
│   │   ├── profile/       # Profile tab sub-screens
│   │   ├── _layout.tsx    # Tab navigator (NativeTabs)
│   │   ├── index.tsx      # Home screen (venue recommendations)
│   │   └── discover.tsx   # Venue discovery/map screen
│   ├── venue/             # Venue detail screens
│   │   └── [id].tsx       # Dynamic venue detail page
│   ├── user/              # User profile screens
│   │   └── [id].tsx       # Dynamic user profile page
│   └── _layout.tsx        # Root layout (theme, auth redirect)
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── ui/           # Base UI components (Button, Card, Input, etc.)
│   │   ├── venue/        # Venue-specific components
│   │   ├── profile/      # Profile-specific components
│   │   └── common/       # Shared components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # External API services
│   ├── stores/           # Zustand state stores
│   ├── theme/            # Design tokens (colors, spacing, typography)
│   ├── types/            # TypeScript type definitions
│   └── config/           # Static configuration data
├── assets/               # Static assets (images, fonts)
├── supabase/            # Supabase migrations and functions
│   ├── migrations/      # SQL migration files
│   └── functions/       # Edge functions
├── .expo/               # Expo build artifacts (gitignored)
├── ios/                 # Native iOS project
├── dist/                # Web build output
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── app.json             # Expo app configuration
└── AGENTS.md            # Project instructions for AI agents
```

## Directory Purposes

**app/ (Routing & Screens):**
- Purpose: Expo Router screens using file-based routing
- Contains: Screen components, layout configurations, route groups
- Key files:
  - `app/_layout.tsx`: Root layout with auth redirect logic
  - `app/(auth)/_layout.tsx`: Stack navigator for auth screens
  - `app/(tabs)/_layout.tsx`: Bottom tab navigator with 3 tabs (Home, Discover, Profile)
  - `app/(tabs)/index.tsx`: Home screen with venue carousel and trending list
  - `app/(tabs)/discover.tsx`: Map-based venue discovery
  - `app/venue/[id].tsx`: Venue detail page (dynamic route)
  - `app/user/[id].tsx`: User profile page (dynamic route)

**app/(auth)/ (Authentication Screens):**
- Purpose: Screens for unauthenticated users
- Contains: Welcome, login, OTP verification, onboarding flow
- Key files:
  - `welcome.tsx`: App introduction with "Entrar" CTA
  - `login.tsx`: Email input for OTP login
  - `verify.tsx`: 6-digit OTP verification
  - `onboarding/photos.tsx`: Upload profile photos (step 1)
  - `onboarding/bio.tsx`: Name, birthdate, bio, occupation (step 2)
  - `onboarding/interests.tsx`: Select interests/tags (step 3)
  - `onboarding/preferences.tsx`: Gender and gender preference (step 4)

**app/(tabs)/ (Main App Screens):**
- Purpose: Authenticated user screens with bottom tab navigation
- Contains: Home, Discover, Profile tabs
- Key files:
  - `index.tsx`: Home screen (venue recommendations, check-in status)
  - `discover.tsx`: Map view with nearby venues
  - `profile/index.tsx`: User's own profile
  - `profile/settings.tsx`: App settings and logout
  - `profile/edit-interests.tsx`: Edit user interests

**src/components/ui/ (Base UI Components):**
- Purpose: Reusable styled UI primitives
- Contains: Button, Card, Input, Avatar, Tag components
- Key files:
  - `Button.tsx`: Primary styled button with variants
  - `Card.tsx`: Container card with consistent styling
  - `Input.tsx`: Text input with label and error support
  - `Avatar.tsx`: User avatar with fallback
  - `Tag.tsx`: Pill-shaped tag for interests/vibes

**src/components/venue/ (Venue Components):**
- Purpose: Venue-specific feature components
- Contains: Venue cards, modals, carousels
- Key files:
  - `VenueCard.tsx`: Card showing venue info (name, distance, active users)
  - `VenueCardSkeleton.tsx`: Loading skeleton for venue cards
  - `VenueCarousel.tsx`: Horizontal scrollable venue list
  - `VenueDetailsModal.tsx`: Bottom sheet with venue details
  - `CheckInModal.tsx`: Check-in confirmation modal with proximity validation
  - `index.ts`: Barrel export for venue components

**src/components/profile/ (Profile Components):**
- Purpose: User profile display components
- Contains: Profile header, photos, bio, interests sections
- Key files:
  - `ProfileHeader.tsx`: User name, age, occupation
  - `ProfilePhotos.tsx`: Photo grid/carousel
  - `ProfileBioSection.tsx`: Bio text display
  - `ProfileInterests.tsx`: Interest tags grid
  - `index.ts`: Barrel export for profile components

**src/components/common/ (Shared Components):**
- Purpose: Components used across multiple features
- Contains: OnboardingProgress, shared UI patterns
- Key files:
  - `OnboardingProgress.tsx`: Step indicator for onboarding flow

**src/hooks/ (Custom Hooks):**
- Purpose: Reusable stateful logic and data fetching
- Contains: Business logic hooks wrapping stores and services
- Key files:
  - `useAuth.ts`: Authentication (login, OTP, onboarding, logout)
  - `useVenues.ts`: Fetch and cache nearby venues
  - `useProfile.ts`: Fetch and update user profiles
  - `useCheckIn.ts`: Check-in logic with proximity validation

**src/services/ (External Services):**
- Purpose: API clients and external integrations
- Contains: Supabase client, auth service, Google Places API calls
- Key files:
  - `supabase.ts`: Configured Supabase client instance
  - `auth.ts`: Auth service (sendEmailVerification, confirmEmailCode, signOut)
  - `places.ts`: Google Places API wrapper for venue search
  - `venueEnrichment.ts`: Enrich venue data with Supabase check-ins/vibes
  - `drinks.ts`: Drink offer CRUD operations

**src/stores/ (Zustand Stores):**
- Purpose: Global state management with Zustand
- Contains: State stores for auth, venues, location, check-ins
- Key files:
  - `authStore.ts`: Session, user profile, onboarding data
  - `venueStore.ts`: Cached venue list, selected venue
  - `locationStore.ts`: GPS coordinates, permissions, location fetching
  - `checkInStore.ts`: Active check-in state

**src/theme/ (Design System):**
- Purpose: Design tokens and theming
- Contains: Colors, spacing, typography, theme provider
- Key files:
  - `index.ts`: ThemeProvider context and useTheme hook
  - `colors.ts`: Color palette (light/dark mode)
  - `spacing.ts`: Spacing scale (xs, sm, md, lg, xl)
  - `typography.ts`: Font sizes and weights

**src/types/ (TypeScript Types):**
- Purpose: Shared type definitions
- Contains: Database types, domain models
- Key files:
  - `database.ts`: Supabase table types (User, Venue, CheckIn, etc.)

**src/config/ (Static Configuration):**
- Purpose: App configuration data and constants
- Contains: Verified venue lists, venue scoring rules
- Key files:
  - `verifiedVenues.ts`: Manually verified venue metadata
  - `venueTypeScores.ts`: Scoring rules for venue types (bar, nightclub, etc.)

**supabase/ (Backend Configuration):**
- Purpose: Supabase database schema and migrations
- Contains: SQL migration files, edge functions
- Key files:
  - `migrations/`: SQL scripts for database schema

**assets/ (Static Assets):**
- Purpose: Images, fonts, icons
- Contains: App icon, splash screen, static images

## Key File Locations

**Entry Points:**
- `app/_layout.tsx`: App entry point, root layout, auth redirect
- `app/index.tsx`: Would redirect to tabs, but not used (Expo Router uses `app/(tabs)/index.tsx`)

**Configuration:**
- `package.json`: Dependencies (Expo, React Native, Supabase, Zustand)
- `app.json`: Expo configuration (app name, slug, icons, splash)
- `tsconfig.json`: TypeScript compiler settings
- `.env`: Environment variables (Supabase URL, API keys) - **Not committed**

**Core Logic:**
- `src/hooks/useAuth.ts`: Authentication flow orchestration
- `src/hooks/useVenues.ts`: Venue discovery logic
- `src/services/supabase.ts`: Supabase client singleton
- `src/stores/authStore.ts`: Global auth state

**Testing:**
- `smoke-test.js`: Manual smoke test script (not automated tests)
- No dedicated `__tests__/` or `*.test.ts` files present

## Naming Conventions

**Files:**
- Screens: `lowercase.tsx` (e.g., `login.tsx`, `discover.tsx`)
- Components: `PascalCase.tsx` (e.g., `Button.tsx`, `VenueCard.tsx`)
- Hooks: `useCamelCase.ts` (e.g., `useAuth.ts`, `useVenues.ts`)
- Services: `camelCase.ts` (e.g., `auth.ts`, `places.ts`)
- Stores: `camelCaseStore.ts` (e.g., `authStore.ts`, `venueStore.ts`)
- Types: `database.ts` (single file for all Supabase types)
- Barrel exports: `index.ts` (re-export components from directory)

**Directories:**
- Route groups: `(groupName)/` (e.g., `(auth)/`, `(tabs)/`)
- Feature directories: `camelCase/` (e.g., `venue/`, `profile/`)
- Component categories: `lowercase/` (e.g., `ui/`, `common/`)

**Components:**
- Functional components only (no class components)
- Named exports for components (e.g., `export function Button()`)
- Default export for screens (e.g., `export default function HomeScreen()`)

**Variables:**
- camelCase for variables and functions
- PascalCase for types and interfaces
- UPPER_SNAKE_CASE for constants (e.g., `VENUE_CACHE_DURATION`)

## Where to Add New Code

**New Screen (Route):**
- Primary code: `app/<route-group>/<screen-name>.tsx`
- If new route group needed: `app/(new-group)/_layout.tsx` + screens
- Tests: Not currently structured for tests

**New Feature Component:**
- Implementation: `src/components/<feature>/<ComponentName>.tsx`
- Export from: `src/components/<feature>/index.ts` (barrel export)
- If UI primitive: `src/components/ui/<ComponentName>.tsx`

**New Hook:**
- Implementation: `src/hooks/use<FeatureName>.ts`
- Pattern: Import stores/services, return state + methods
- Use `useCallback` for actions, `useEffect` for initialization

**New Service/API Integration:**
- Implementation: `src/services/<serviceName>.ts`
- Export async functions returning `{ success: boolean, data?, error? }`
- Configure client in same file or import from `supabase.ts`

**New Store:**
- Implementation: `src/stores/<featureName>Store.ts`
- Pattern: `create<State>()` with state properties and setter methods
- Export store hook (e.g., `export const useFeatureStore = create(...)`)

**New Type:**
- Add to: `src/types/database.ts` (if Supabase-related)
- Or create: `src/types/<domain>.ts` (if domain-specific)
- Export types for use across codebase

**Utilities:**
- Shared helpers: `src/lib/<utilName>.ts` (currently empty, but exists)
- Or add to relevant service file if tightly coupled

**Static Configuration:**
- Add to: `src/config/<configName>.ts`
- Export constants and lookup objects
- Use for venue metadata, scoring rules, feature flags

## Special Directories

**.expo/**
- Purpose: Expo build artifacts and cache
- Generated: Yes (by Expo CLI)
- Committed: No (in `.gitignore`)

**ios/**
- Purpose: Native iOS project files (Xcode)
- Generated: Yes (by `expo prebuild` or `expo run:ios`)
- Committed: Yes (for EAS builds)

**dist/**
- Purpose: Web build output from `expo export:web`
- Generated: Yes (by Expo build)
- Committed: No (in `.gitignore`)

**node_modules/**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**.git/**
- Purpose: Git version control metadata
- Generated: Yes (by `git init`)
- Committed: No (Git internal)

**.planning/**
- Purpose: Project planning documents and codebase analysis (GSD workflow)
- Generated: Yes (by GSD commands)
- Committed: Yes (for agent context)

## Routing Structure (Expo Router)

**File-based routing:**
- `app/index.tsx` → `/` (but redirects handled by `_layout.tsx`)
- `app/(tabs)/index.tsx` → `/` (actual home when authenticated)
- `app/(tabs)/discover.tsx` → `/discover`
- `app/(tabs)/profile/index.tsx` → `/profile`
- `app/(tabs)/profile/settings.tsx` → `/profile/settings`
- `app/(auth)/welcome.tsx` → `/welcome`
- `app/(auth)/login.tsx` → `/login`
- `app/(auth)/verify.tsx` → `/verify`
- `app/(auth)/onboarding/photos.tsx` → `/onboarding/photos`
- `app/venue/[id].tsx` → `/venue/:id` (dynamic)
- `app/user/[id].tsx` → `/user/:id` (dynamic)

**Layout nesting:**
- `app/_layout.tsx` (root) → wraps entire app
- `app/(auth)/_layout.tsx` (auth group) → Stack navigator for auth screens
- `app/(tabs)/_layout.tsx` (tabs group) → Bottom tab navigator
- `app/(tabs)/profile/_layout.tsx` (profile stack) → Stack navigator for profile sub-screens
- `app/(auth)/onboarding/_layout.tsx` (onboarding stack) → Stack navigator for onboarding steps

**Protected routing:**
- Logic in: `app/_layout.tsx` (`useProtectedRoute` hook)
- Redirects unauthenticated users to `/(auth)/welcome`
- Redirects authenticated users without profile to `/(auth)/onboarding/photos`
- Redirects authenticated users with profile to `/(tabs)`

---

*Structure analysis: 2026-02-10*
