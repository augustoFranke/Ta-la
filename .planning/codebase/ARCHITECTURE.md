# Architecture

**Analysis Date:** 2026-02-10

## Pattern Overview

**Overall:** Component-based React Native architecture with Expo Router (file-based routing)

**Key Characteristics:**
- Client-side mobile app using React Native with Expo SDK 54
- File-based routing via Expo Router (no React Navigation)
- Centralized state management with Zustand stores
- Service layer for external API calls (Supabase, Google Places)
- Hook-based data fetching and business logic abstraction
- Component-driven UI with reusable design system

## Layers

**Presentation Layer (app/):**
- Purpose: Screen components and routing configuration
- Location: `app/`
- Contains: Route screens organized by navigation groups
- Depends on: `src/hooks/`, `src/stores/`, `src/components/`, `src/theme/`
- Used by: Expo Router file system
- Pattern: File-based routing with layout nesting

**Component Layer (src/components/):**
- Purpose: Reusable UI components and composed feature components
- Location: `src/components/`
- Contains: UI primitives (`ui/`), feature components (`venue/`, `profile/`), shared components (`common/`)
- Depends on: `src/theme/`, `src/types/`, `src/stores/` (via hooks)
- Used by: Presentation layer screens
- Pattern: Composition with themed styling

**Business Logic Layer (src/hooks/):**
- Purpose: Custom hooks encapsulating data fetching, side effects, and business rules
- Location: `src/hooks/`
- Contains: `useAuth.ts`, `useVenues.ts`, `useProfile.ts`, `useCheckIn.ts`
- Depends on: `src/services/`, `src/stores/`, `src/types/`
- Used by: Presentation layer and components
- Pattern: React Hooks for stateful logic

**State Management Layer (src/stores/):**
- Purpose: Global application state with Zustand
- Location: `src/stores/`
- Contains: `authStore.ts`, `venueStore.ts`, `locationStore.ts`, `checkInStore.ts`
- Depends on: `src/types/`, external libraries (expo-location)
- Used by: Hooks and components
- Pattern: Zustand stores with actions and selectors

**Service Layer (src/services/):**
- Purpose: External API communication and data transformation
- Location: `src/services/`
- Contains: `supabase.ts` (client), `auth.ts`, `places.ts`, `drinks.ts`, `venueEnrichment.ts`
- Depends on: `@supabase/supabase-js`, `src/types/`
- Used by: Hooks layer
- Pattern: Async functions returning typed results

**Configuration Layer (src/config/):**
- Purpose: Static configuration data and constants
- Location: `src/config/`
- Contains: `verifiedVenues.ts`, `venueTypeScores.ts`
- Depends on: `src/types/`
- Used by: Service layer
- Pattern: Exported constants and lookup tables

## Data Flow

**Authentication Flow:**

1. User enters email in `app/(auth)/login.tsx`
2. Screen calls `useAuth().sendOTP()` hook method
3. Hook calls `sendEmailVerification()` from `src/services/auth.ts`
4. Service uses Supabase client to send OTP via email
5. User verifies code, hook calls `confirmEmailCode()` service
6. Service updates Supabase Auth session
7. `onAuthStateChanged` listener in `useAuth` detects session change
8. Hook fetches user profile from `users` table via Supabase
9. `authStore.setSession()` and `authStore.setUser()` update global state
10. Root layout (`app/_layout.tsx`) `useProtectedRoute` redirects to tabs or onboarding

**Venue Discovery Flow:**

1. `app/(tabs)/index.tsx` mounts and calls `useVenues({ autoFetch: true })`
2. Hook checks `locationStore` for coordinates
3. If no location, calls `locationStore.bootstrap()` to request permissions and get GPS
4. Hook calls `places.ts` service to fetch nearby venues from Google Places API
5. Service enriches venue data with Supabase check-in counts and vibes
6. Hook updates `venueStore.setVenues()` with enriched results
7. Screen renders `VenueCarousel` component with venue data
8. User taps venue card, router navigates to `app/venue/[id].tsx`

**Check-In Flow:**

1. User taps "Check-in" on venue detail screen
2. Screen opens `CheckInModal` component
3. Component calls `useCheckIn().performCheckIn()` hook method
4. Hook validates proximity (50-100m) using `locationStore` coordinates
5. Hook inserts check-in record to Supabase `checkins` table
6. Hook updates `checkInStore.setActiveCheckIn()` with new check-in
7. Supabase Realtime broadcasts check-in to other users at same venue
8. Modal closes and screen shows active check-in state

**State Management:**

- Zustand stores hold global state (auth, venues, location, check-ins)
- Hooks read from stores and call store actions
- Components subscribe to stores via hooks (automatic re-render on updates)
- No Redux, Context API used minimally (ThemeProvider only)

## Key Abstractions

**Stores (Zustand):**
- Purpose: Global state containers with actions
- Examples: `src/stores/authStore.ts`, `src/stores/venueStore.ts`, `src/stores/locationStore.ts`, `src/stores/checkInStore.ts`
- Pattern: `create<State>()` with state properties and action methods
- Usage: Hooks call store actions, components subscribe via custom hooks

**Services:**
- Purpose: Encapsulate external API calls and data transformation
- Examples: `src/services/auth.ts`, `src/services/places.ts`, `src/services/supabase.ts`
- Pattern: Async functions returning `Promise<{ success: boolean, data?, error? }>`
- Usage: Called by custom hooks, never directly from components

**Custom Hooks:**
- Purpose: Reusable stateful logic combining stores, services, and side effects
- Examples: `src/hooks/useAuth.ts`, `src/hooks/useVenues.ts`, `src/hooks/useCheckIn.ts`
- Pattern: `useEffect` for initialization, `useCallback` for actions, return state + methods
- Usage: Screens and feature components import and invoke hooks

**Route Groups (Expo Router):**
- Purpose: Organize routes with shared layouts without affecting URL structure
- Examples: `app/(auth)/`, `app/(tabs)/`, `app/(auth)/onboarding/`
- Pattern: `(groupName)/_layout.tsx` defines Stack or Tabs navigator for children
- Usage: Routes nested in group inherit layout configuration

## Entry Points

**Root Layout:**
- Location: `app/_layout.tsx`
- Triggers: App launch
- Responsibilities:
  - Wrap app with `ThemeProvider` and `SafeAreaProvider`
  - Initialize auth state via `useAuth` hook
  - Protected routing with `useProtectedRoute` (redirects based on auth state)
  - Define root Stack navigator with auth, tabs, and modal screens

**Authentication Entry:**
- Location: `app/(auth)/welcome.tsx`
- Triggers: User not authenticated
- Responsibilities: Show welcome screen with login CTA

**Authenticated Entry:**
- Location: `app/(tabs)/index.tsx`
- Triggers: User authenticated and profile complete
- Responsibilities: Show home screen with venue recommendations and check-in

**Onboarding Entry:**
- Location: `app/(auth)/onboarding/photos.tsx`
- Triggers: User authenticated but profile incomplete (`needsOnboarding = true`)
- Responsibilities: Multi-step onboarding flow to complete user profile

## Error Handling

**Strategy:** Service-level error catching with user-friendly messages

**Patterns:**
- Services return `{ success: boolean, error?: string }` instead of throwing
- Hooks catch service errors and update store error state
- Components display error messages from store state (not caught exceptions)
- Supabase errors are mapped to Portuguese user-facing messages in hooks
- Location errors set `locationStore.errorMsg` displayed in UI
- Auth errors show inline validation feedback on form screens

**Example:**
```typescript
// Service (src/services/auth.ts)
export async function sendEmailVerification(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Hook (src/hooks/useAuth.ts)
const sendOTP = useCallback(async (email: string) => {
  const result = await sendEmailVerification(email);
  if (!result.success) {
    return { success: false, error: result.error || 'Erro ao enviar código' };
  }
  return { success: true };
}, []);

// Component (app/(auth)/login.tsx)
const result = await sendOTP(email);
if (!result.success) {
  Alert.alert('Erro', result.error);
}
```

## Cross-Cutting Concerns

**Logging:** 
- Approach: `console.error()` for caught errors in hooks and services
- No centralized logging service (future: Sentry integration)

**Validation:** 
- Approach: Inline validation in screens (email format, required fields)
- No form library (uses `useState` for simple forms)
- Supabase RLS policies enforce database-level validation

**Authentication:** 
- Approach: Supabase Auth with Email OTP (passwordless)
- Session managed by `authStore` with auto-refresh
- Protected routes via `useProtectedRoute` in root layout
- JWT token stored in AsyncStorage by Supabase client

**Authorization:**
- Approach: Row-Level Security (RLS) policies in Supabase
- User ID from JWT claims used in database queries
- No role-based access control (all users have same permissions)

**Theming:**
- Approach: `ThemeProvider` context with light/dark mode support
- Design tokens in `src/theme/` (colors, spacing, typography)
- Components use `useTheme()` hook for consistent styling

**Location:**
- Approach: `expo-location` with permission handling in `locationStore`
- GPS coordinates cached in store, refreshed on venue search
- Proximity validation for check-ins (50-100m radius)

---

*Architecture analysis: 2026-02-10*
