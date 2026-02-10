# External Integrations

**Analysis Date:** 2026-02-10

## APIs & External Services

**Backend as a Service:**
- Supabase - primary backend for auth, relational data, RPC, and object storage
  - SDK/Client: `@supabase/supabase-js` configured in `src/services/supabase.ts`
  - Auth: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` read in `src/services/supabase.ts`
  - Usage examples: auth OTP in `src/services/auth.ts`, profile/check-in/drinks queries in `src/hooks/useAuth.ts`, `src/hooks/useProfile.ts`, `src/hooks/useCheckIn.ts`, `src/services/drinks.ts`

**Places/Geospatial Discovery:**
- Radar Places API - nearby venue search for nightlife discovery in `src/services/places.ts`
  - SDK/Client: direct `fetch` HTTP calls in `src/services/places.ts`
  - Auth: `EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY` from `src/services/places.ts`
  - Endpoint usage: `https://api.radar.io/v1/search/places` called in `src/services/places.ts`

**Device Platform Services:**
- Expo Location - foreground permission and coordinates via `src/stores/locationStore.ts`
  - SDK/Client: `expo-location` imports in `src/stores/locationStore.ts`, `app/(tabs)/profile/settings.tsx`
  - Auth: OS permission prompt configured in `app.json`
- Media Library (photo selection) - image asset selection in `app/(auth)/onboarding/photos.tsx`
  - SDK/Client: `expo-image-picker` in `app/(auth)/onboarding/photos.tsx`
  - Auth: OS media permission requested by `ImagePicker.requestMediaLibraryPermissionsAsync()` in `app/(auth)/onboarding/photos.tsx`

## Data Storage

**Databases:**
- PostgreSQL via Supabase (managed schema and RLS)
  - Connection: Supabase project URL + anon key via `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `src/services/supabase.ts`
  - Client: `@supabase/supabase-js` from `src/services/supabase.ts`
  - Schema evolution: SQL migrations in `supabase/migrations/001_enable_extensions.sql` through `supabase/migrations/019_fix_venue_metadata_rls_v2.sql`

**File Storage:**
- Supabase Storage bucket `avatars` used for user photos in `app/(auth)/onboarding/photos.tsx` and `src/hooks/useProfile.ts`

**Caching:**
- Client-side session persistence in AsyncStorage (`src/services/supabase.ts`)
- No dedicated external cache service detected (Redis/Memcached not detected)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (email OTP)
  - Implementation: `supabase.auth.signInWithOtp` and `supabase.auth.verifyOtp` in `src/services/auth.ts`; state sync via `supabase.auth.onAuthStateChange` in `src/services/auth.ts` and orchestrated by `src/hooks/useAuth.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry/Bugsnag/Datadog SDK imports)

**Logs:**
- Application logging uses `console.error` in `src/services/places.ts`, `src/hooks/useAuth.ts`, `src/hooks/useProfile.ts`, `src/hooks/useCheckIn.ts`, `src/services/venueEnrichment.ts`

## CI/CD & Deployment

**Hosting:**
- Mobile/web app delivered through Expo-managed app configuration in `app.json` and scripts in `package.json`

**CI Pipeline:**
- Not detected (`.github/workflows/` not present; no other CI config files detected)

## Environment Configuration

**Required env vars:**
- `EXPO_PUBLIC_SUPABASE_URL` (`src/services/supabase.ts`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`src/services/supabase.ts`)
- `EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY` (`src/services/places.ts`)
- `EXPO_PUBLIC_DEV_SKIP_AUTH` (optional dev toggle in `src/hooks/useAuth.ts`)

**Secrets location:**
- Root `.env` file present and `.env.example` present (values intentionally not read)
- Runtime access pattern is Expo public env via `process.env.EXPO_PUBLIC_*` in `src/services/supabase.ts`, `src/services/places.ts`, `src/hooks/useAuth.ts`

## Webhooks & Callbacks

**Incoming:**
- None detected (mobile client codebase has no webhook receiver endpoints)

**Outgoing:**
- Radar Places HTTP request to `https://api.radar.io/v1/search/places` in `src/services/places.ts`
- Supabase API calls via `@supabase/supabase-js` across `src/services/auth.ts`, `src/hooks/useProfile.ts`, `src/hooks/useCheckIn.ts`, `src/services/drinks.ts`, `src/services/venueEnrichment.ts`

---

*Integration audit: 2026-02-10*
