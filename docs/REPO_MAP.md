# Repository Map

## 1. Project Snapshot

- Name: `ta-la-app`
- Runtime: Expo SDK 54 + React Native 0.81 + Expo Router
- Language: TypeScript
- State: Zustand
- Backend: Supabase (Auth + Postgres + RPC + Realtime + Storage)
- Primary quality gate: `npm test` (`lint` + `typecheck`)

## 2. Top-Level Structure

| Path | Purpose |
| --- | --- |
| `app/` | Expo Router routes (auth flow, tabs, public user profile). |
| `src/` | Application logic: UI components, hooks, services, stores, theme, types. |
| `supabase/` | Database migrations and local CLI temp metadata. |
| `docs/` | Documentation (this map lives here). |
| `assets/` | App icons/splash/favicon assets. |
| `ios/` | Native iOS project files generated/managed by Expo prebuild. |
| `specs/` | Feature/spec artifacts. |
| `.planning/` | Internal planning/analysis documents. |
| `dist/` | Build/export output. |
| `package.json` | Scripts and dependencies. |
| `app.json` | Expo app config (name, slug, scheme, permissions, plugins). |
| `eslint.config.js` | ESLint flat config (`eslint-config-expo`). |
| `tsconfig.json` | TypeScript config (`expo/tsconfig.base` + `strict: true`). |

## 3. Runtime Architecture

### Routing and Navigation

- Root layout: `app/_layout.tsx`
  - Sets theme provider and safe-area provider.
  - Applies auth/onboarding route guards using `useAuth()`.
  - Registers stacks for `(auth)`, `(tabs)`, and `user/[id]`.
- Auth stack layout: `app/(auth)/_layout.tsx`
- Onboarding stack layout: `app/(auth)/onboarding/_layout.tsx`
- Tabs layout: `app/(tabs)/_layout.tsx`
- Profile nested stack: `app/(tabs)/profile/_layout.tsx`

### State and Data Flow (high-level)

1. UI screens call hooks (`useAuth`, `useVenues`, `useCheckIn`, `useProfile`).
2. Hooks orchestrate Supabase + external API calls through `src/services/*`.
3. Cross-screen state is stored in Zustand stores in `src/stores/*`.
4. Realtime updates are consumed through `useVenueRealtime` and `useInteractionRealtime`.

## 4. Route Map (`app/`)

### Auth group (`app/(auth)/`)

- `welcome.tsx` - Entry/branding screen, CTA to login.
- `login.tsx` - Email input, sends OTP.
- `verify.tsx` - OTP verification.
- `onboarding/photos.tsx` - Upload profile photos.
- `onboarding/bio.tsx` - Name, birth date, bio, occupation.
- `onboarding/interests.tsx` - Interest selection.
- `onboarding/preferences.tsx` - Gender and gender preference.
- `onboarding/permissions.tsx` - Location permission + onboarding completion.

### Tabs group (`app/(tabs)/`)

- `index.tsx` - Home venue discovery + check-in entry.
- `discover.tsx` - Search users, venue roster, interactions, block action.
- `profile/index.tsx` - Current user profile view/edit.
- `profile/settings.tsx` - App/location/notification preferences.
- `profile/dev-settings.tsx` - Dev tools (GPS override, simulated users).
- `chat.tsx` - Placeholder.
- `partners.tsx` - Placeholder.

### Other routes

- `user/[id].tsx` - Public profile of another user (interact/block/report).

## 5. Source Map (`src/`)

### `src/components/`

- `ui/` - Base UI primitives (`Button`, `Input`, `Card`, `Avatar`, `Tag`).
- `venue/` - Venue presentation + check-in UI (`VenueCard`, `VenueCarousel`, `CheckInModal`, skeleton).
- `profile/` - Profile sections (`ProfileHeader`, `ProfilePhotos`, `ProfileBioSection`, `ProfileInterests`).
- `interaction/` - Interaction flows (`InteractionButtons`, `ConfirmationDialog`, `MatchCelebration`, `ReceivedInteractions`).
- `common/OnboardingProgress.tsx` - Step indicator used in onboarding.
- `PresenceConfirmationModal.tsx` - Periodic "still here?" confirmation dialog.

### `src/hooks/`

- `useAuth.ts` - Auth session lifecycle, OTP flow, onboarding completion, logout reset.
- `useCheckIn.ts` - Active check-in fetch, check-in RPC execution, check-out flow.
- `useVenues.ts` - Nearby venue fetching, caching policy, enrichment with active counts.
- `useProfile.ts` - Profile/interest/photo fetch and updates.
- `useVenueRealtime.ts` - Realtime subscription for check-in roster changes.
- `useInteractionRealtime.ts` - Realtime subscription for interactions table changes.
- `usePresenceConfirmation.ts` - Timer + app lifecycle logic for presence confirmation prompts.

### `src/services/`

- `supabase.ts` - Supabase client initialization using env vars.
- `auth.ts` - Supabase auth wrappers (send OTP, verify OTP, get session/user, listener).
- `places.ts` - Google Places nearby search + venue normalization/scoring/filtering.
- `venueEnrichment.ts` - Adds active/open-to-meeting counts from Supabase.
- `interactions.ts` - Send/fetch/unmatch interaction flows via RPC/table updates.
- `drinks.ts` - Drink relation and offer/response logic.
- `moderation.ts` - Block/report actions + blocked ID fetch.
- `notifications.ts` - Notification preferences fetch/upsert.

### `src/stores/` (Zustand)

- `authStore.ts` - Session, profile, onboarding draft state.
- `locationStore.ts` - Permission, coordinates, dev override coordinates.
- `checkInStore.ts` - Active check-in state, denial reason, loading/error.
- `venueStore.ts` - Venue list, cache timestamp/location, selected venue.
- `blockStore.ts` - Blocked IDs + loaded flag.
- `notificationStore.ts` - Notification preferences + optimistic updates.

### `src/config/`

- `verifiedVenues.ts` - Venue verification patterns/scoring.
- `venueTypeScores.ts` - Venue type weighting/scoring.

### `src/theme/`

- `colors.ts`, `spacing.ts`, `typography.ts`, `index.ts` (theme provider + tokens).

### `src/types/`

- `database.ts` - Domain and Supabase-related types (users, check-ins, interactions, notifications, venues, etc.).

## 6. Supabase Map (`supabase/`)

### Core migrations by area

- `001`-`006`: Extensions + core entities (users, photos, interests, venues, check-ins).
- `007`-`010`: Drinks/matches/messages + reports/blocks.
- `011`: SQL functions baseline.
- `012`-`019`: Auth/profile/table policy adjustments and venue metadata fixes.
- `020`-`023`: Check-in trust RPC + auto-expiry + visibility + roster RPC update.
- `024`-`027`: Moderation indexes + server drink validation + notification prefs + availability.
- `028`-`031`: Realtime enablement + trust calibration + favorites + RLS recursion fix.
- `032`-`034`: Interactions schema + send/get interaction RPCs.
- `20260219_update_checkin_proximity_threshold.sql`: Proximity threshold update.

### Notes

- `supabase/.temp/` contains Supabase CLI local metadata (not app runtime code).

## 7. Environment Variables in Active Use

Detected in app/source code:

- `EXPO_PUBLIC_SUPABASE_URL` (`src/services/supabase.ts`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`src/services/supabase.ts`)
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` (`src/services/places.ts`)
- `EXPO_PUBLIC_DEV_SKIP_AUTH` (`src/hooks/useAuth.ts`, dev-only shortcut)

## 8. Scripts and Quality Commands

From `package.json`:

- `npm start` - Expo dev server.
- `npm run web` - Expo web preview.
- `npm run android` - Run Android native target.
- `npm run ios` - Run iOS native target.
- `npm run lint` - Expo ESLint.
- `npm run typecheck` - TypeScript check (`tsc --noEmit`).
- `npm run test:project` - `lint` + `typecheck`.
- `npm test` - alias to `test:project`.

## 9. Current Gaps / Observations

- No dedicated automated unit/integration test suite is present in the codebase yet.
- `chat` and `partners` tab routes are placeholders.
- Repository contains planning/spec directories (`.planning`, `specs`) that are not runtime app code.
