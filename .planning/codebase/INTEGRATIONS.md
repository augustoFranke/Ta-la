# External Integrations

**Analysis Date:** 2026-02-10

## Database

**Supabase PostgreSQL:**
- Client: `@supabase/supabase-js` ^2.90.1
- Configuration: `src/services/supabase.ts`
- Connection: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Session storage: AsyncStorage for persistence
- Auto-refresh tokens: enabled
- Detect session in URL: disabled (mobile app)

**Tables:**
- `users` - User profiles with location (PostGIS point)
- `photos` - User photo gallery (ordered)
- `interests` - User interest tags
- `avatars` - User avatar images
- `venues` - Cached venue data with dating scores
- `venue_metadata` - Nightlife scoring and curation flags
- `venue_vibes` - User-submitted venue atmosphere tags
- `venue_flags` - Community curation (not_nightlife, closed, wrong_category)
- `check_ins` - Active check-ins with `open_to_meeting` status
- `drinks` - Drink offers sent between users
- `matches` - Confirmed connections between users
- `user_favorite_places` - User-saved venues
- `messages` - Chat messages (out of scope for MVP)

**Key Queries:**
- User profiles: `supabase.from('users').select()`
- Check-ins: `supabase.from('check_ins').insert()` and proximity validation
- Venue vibes: `supabase.from('venue_vibes').upsert()`
- Drinks: `supabase.from('drinks').insert()` for offers
- Favorites: `supabase.from('user_favorite_places').upsert()`

## Authentication

**Supabase Auth:**
- Provider: Email OTP (no password)
- Implementation: `src/services/auth.ts`
- Session management: AsyncStorage via Supabase client config

**Auth Flow:**
1. `sendEmailVerification(email)` - Sends 6-digit OTP code
2. `confirmEmailCode(email, code)` - Verifies OTP and returns session
3. Session auto-refresh enabled
4. Auth state listener: `onAuthStateChange()` callback

**Auth Store:**
- Zustand store: `src/stores/authStore.ts`
- Hooks: `src/hooks/useAuth.ts` for auth state access

**Functions:**
- `signOut()` - Clears session
- `getSession()` - Retrieves current session
- `getCurrentUser()` - Retrieves authenticated user

## APIs & Services

**Radar Places API:**
- Purpose: Venue discovery and location services
- Base URL: `https://api.radar.io/v1`
- Auth: `EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY`
- Implementation: `src/services/places.ts`
- Category filter: `food-beverage`
- Default radius: 10,000 meters
- Nightlife score threshold: 40+
- Blacklisted venue types: beauty salons, gyms, pharmacies, banks, schools, retail stores

**Venue Services:**
- `src/services/places.ts` - Radar API integration and nightlife filtering
- `src/services/venueScoring.ts` - Nightlife score calculation
- `src/services/venueDetails.ts` - Venue metadata enrichment
- `src/services/venueEnrichment.ts` - Check-in data and vibe aggregation
- `src/services/venueFlags.ts` - Community curation flag operations

**Custom Services:**
- `src/services/drinks.ts` - Drink offer logic
- `src/config/verifiedVenues.ts` - Manually verified venue list
- `src/config/venueTypeScores.ts` - Venue type scoring weights

## Location Services

**expo-location:**
- Package: expo-location ~19.0.8
- Store: `src/stores/locationStore.ts` (Zustand)
- Permission flow: `requestForegroundPermissionsAsync()`
- Location fetch: `getCurrentPositionAsync()` with balanced accuracy
- Bootstrap: `syncPermission()` then `getCurrentLocation()`

**Location State:**
- `latitude`, `longitude` - Current GPS coordinates
- `permissionGranted` - Permission status
- `isLoading` - Loading state during location fetch
- `errorMsg` - Error messages for permission/location failures

**Usage:**
- Venue discovery: requires location for radius search
- Check-in validation: 50-100m proximity to venue
- User location storage: PostGIS point in `users` table

**Permissions:**
- iOS: `NSLocationWhenInUseUsageDescription` in `app.json`
- Android: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`
- Plugin config: `expo-location` plugin with usage description

## Realtime

**Supabase Realtime:**
- Channel subscriptions: Not actively used yet
- Auth state changes: `supabase.auth.onAuthStateChange()` listener in `src/services/auth.ts`
- Future use cases: Live check-ins, drink offers, match notifications

**Current Implementation:**
- No active realtime channels detected
- Auth state listener only for session management

## Caching & Analytics

**Upstash Redis:**
- Purpose: Backend caching (not used in React Native client)
- SDK: `@upstash/redis` ^1.36.1
- Connection: `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`
- Note: Package present but no usage detected in client code

**PostHog Analytics:**
- Purpose: User behavior tracking (backend integration)
- SDK: `posthog-node` ^5.21.0
- Connection: `EXPO_PUBLIC_POSTHOG_API_KEY`
- Note: Server-side package, not integrated in React Native client yet

## Storage

**File Storage:**
- Supabase Storage for avatars and photos
- Tables: `avatars`, `photos`
- Upload: `expo-image-picker` for selecting images
- Implementation: `src/hooks/useProfile.ts`, `app/(auth)/onboarding/photos.tsx`

**Session Storage:**
- AsyncStorage: `@react-native-async-storage/async-storage` ^2.2.0
- Purpose: Supabase session persistence across app restarts

## Deep Linking

**Expo Linking:**
- Package: expo-linking ^8.0.11
- Custom scheme: `tala://` (configured in `app.json`)
- Use cases: OTP verification redirects, share links (future)

## Environment Configuration

**Required env vars:**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase public API key
- `EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY` - Radar location API key
- `EXPO_PUBLIC_POSTHOG_API_KEY` - PostHog analytics (optional)
- `EXPO_SUPABASE_PRIVATE_KEY` - Service role key (backend only, never exposed)
- `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN` - Redis cache (backend only)

**Secrets location:**
- `.env` file (excluded from git)
- Access via `process.env.EXPO_PUBLIC_*` for client-side vars
- Service role keys never used in React Native code

## Webhooks & Callbacks

**Incoming:**
- None (no webhook endpoints in mobile app)

**Outgoing:**
- None (no webhooks sent from mobile app)
- Future: Supabase Edge Functions for server-side webhook handling

---

*Integration audit: 2026-02-10*
