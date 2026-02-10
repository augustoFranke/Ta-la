# Technology Stack

**Analysis Date:** 2026-02-10

## Languages

**Primary:**
- TypeScript (strict mode) - app logic and UI in `app/_layout.tsx`, `app/(tabs)/discover.tsx`, `src/hooks/useAuth.ts`, `src/services/places.ts`

**Secondary:**
- SQL (Supabase migrations) - schema, RLS, and RPC evolution in `supabase/migrations/001_enable_extensions.sql`, `supabase/migrations/011_create_functions.sql`, `supabase/migrations/019_fix_venue_metadata_rls_v2.sql`
- JSON - runtime/app/tooling config in `package.json`, `app.json`, `tsconfig.json`

## Runtime

**Environment:**
- Node.js runtime required by Expo CLI/npm scripts (exact version not pinned; `.nvmrc` not detected)
- React Native runtime `0.81.5` and React `19.1.0` from `package.json`
- Expo SDK `~54.0.31` from `package.json`

**Package Manager:**
- npm (scripts and lockfile pattern in `package.json`)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Expo + React Native - mobile app platform and native tooling in `package.json`, `app.json`
- Expo Router `^6.0.21` - file-based navigation entrypoint `expo-router/entry` in `package.json`, route definitions in `app/_layout.tsx`
- Zustand `^5.0.10` - client state containers in `src/stores/authStore.ts`, `src/stores/locationStore.ts`, `src/stores/checkInStore.ts`

**Testing:**
- Not detected (no `jest.config.*`, `vitest.config.*`, or test scripts in `package.json`)

**Build/Dev:**
- Expo CLI (`expo start`, `expo run:android`, `expo run:ios`, `expo start --web`) in `package.json`
- TypeScript compiler via Expo base config in `tsconfig.json`
- Ngrok package for Expo tunneling (`@expo/ngrok`) in `package.json`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` `^2.90.1` - database/auth/storage client initialized in `src/services/supabase.ts` and used across `src/services/auth.ts`, `src/hooks/useProfile.ts`, `src/hooks/useCheckIn.ts`
- `expo-location` `~19.0.8` - geolocation permission and coordinate retrieval in `src/stores/locationStore.ts` and permission UX in `app/(tabs)/profile/settings.tsx`
- `expo-router` `^6.0.21` - app navigation/layout orchestration in `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx`

**Infrastructure:**
- `@react-native-async-storage/async-storage` `^2.2.0` - persisted Supabase auth session storage in `src/services/supabase.ts`
- `react-native-url-polyfill` `^3.0.0` - URL compatibility for Supabase runtime in `src/services/supabase.ts`
- `expo-image-picker` `~17.0.10` - media library integration for onboarding/profile photos in `app/(auth)/onboarding/photos.tsx`
- `expo-linking` `^8.0.11` (plus RN `Linking`) - opens OS settings in `app/(tabs)/profile/settings.tsx`; app deep-link scheme declared in `app.json`

## Configuration

**Environment:**
- Runtime env access uses Expo public vars in code: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `src/services/supabase.ts`; `EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY` from `src/services/places.ts`; `EXPO_PUBLIC_DEV_SKIP_AUTH` from `src/hooks/useAuth.ts`
- `.env` and `.env.example` files are present at project root (environment configuration files detected; contents intentionally not read)

**Build:**
- App/native permissions and Expo plugin config in `app.json` (location permissions + `expo-location` plugin)
- TS strict configuration in `tsconfig.json`
- Package scripts and dependency graph in `package.json`

## Platform Requirements

**Development:**
- npm install + Expo CLI workflow via scripts in `package.json`
- Mobile permissions and native metadata configured in `app.json` for iOS and Android location access

**Production:**
- Expo-managed React Native app target (iOS, Android, Web metadata in `app.json`)
- Backend platform dependency on Supabase project (tables, functions, storage buckets managed by SQL under `supabase/migrations/`)

---

*Stack analysis: 2026-02-10*
