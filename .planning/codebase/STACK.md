# Technology Stack

**Analysis Date:** 2026-02-10

## Languages

**Primary:**
- TypeScript ~5.9.2 - All application code
- JavaScript - Config files and metro bundler

**Type System:**
- Strict mode enabled in `tsconfig.json`
- Extends Expo base TypeScript config

## Runtime

**Environment:**
- React 19.1.0
- React Native 0.81.5
- Node.js v25.6.0

**Package Manager:**
- npm (package-lock.json present)

## Frameworks

**Core:**
- Expo SDK ~54.0.31 - React Native development platform
- Expo Router ^6.0.21 - File-based navigation under `app/`
- React Native New Architecture enabled (`newArchEnabled: true` in `app.json`)

**State Management:**
- Zustand ^5.0.10 - Global state stores in `src/stores/`

**UI:**
- expo-linear-gradient ~15.0.8 - Gradient components
- react-native-safe-area-context ^5.6.2 - Safe area handling
- react-native-screens ~4.16.0 - Native navigation primitives
- @expo/vector-icons ^15.0.3 - Icon library

## Key Dependencies

**Critical:**
- @supabase/supabase-js ^2.90.1 - Database, auth, realtime backend
- @react-native-async-storage/async-storage ^2.2.0 - Session persistence for Supabase
- react-native-url-polyfill ^3.0.0 - URL API polyfill required by Supabase

**Platform Services:**
- expo-location ~19.0.8 - Location permissions and GPS
- expo-image-picker ~17.0.10 - Photo uploads
- expo-linking ^8.0.11 - Deep linking
- expo-constants ^18.0.13 - Environment variables access
- expo-status-bar ~3.0.9 - Status bar styling

**External Integrations:**
- @upstash/redis ^1.36.1 - Redis caching (backend integration)
- posthog-node ^5.21.0 - Analytics (backend/server-side only)
- codex ^0.2.3 - Purpose unclear from manifest

**Development:**
- @expo/ngrok ^4.1.3 - Development tunneling
- @types/react ~19.1.0 - TypeScript definitions

## Build & Development

**Development Mode:**
- Expo Go / EAS Preview builds only (no development builds in use)
- Run: `npm start` (Expo dev server)
- Web: `npm run web` (Web preview)

**Build Targets:**
- iOS: Bundle identifier `com.tala.app`, tablet support enabled
- Android: Edge-to-edge enabled, predictive back gesture disabled

**Entry Point:**
- `expo-router/entry` (file-based routing)

## Configuration

**Environment:**
- `.env` file present (excluded from git)
- `.env.example` file documents required variables:
  - `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
  - `EXPO_SUPABASE_PRIVATE_KEY` - Supabase service role (backend only)
  - `EXPO_PUBLIC_RADAR_PUBLISHABLE_KEY` - Radar location API
  - `UPSTASH_REDIS_URL` - Redis cache URL
  - `UPSTASH_REDIS_TOKEN` - Redis auth token
  - `EXPO_PUBLIC_POSTHOG_API_KEY` - Analytics key

**App Configuration:**
- `app.json` - Expo app manifest
- Custom scheme: `tala://`
- User interface style: automatic (light/dark)

**TypeScript:**
- `tsconfig.json` - Extends `expo/tsconfig.base` with strict mode

**Platform Permissions:**
- iOS: `NSLocationWhenInUseUsageDescription` for location
- Android: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`

## Platform Requirements

**Development:**
- Node.js v25.6.0 (or compatible)
- Expo Go app or EAS Preview
- iOS/Android simulator or physical device

**Production:**
- Deployment target: Expo Application Services (EAS)
- Target region: Dourados, MS, Brazil

---

*Stack analysis: 2026-02-10*
