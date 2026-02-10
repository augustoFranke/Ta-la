# Codebase Concerns

**Analysis Date:** 2026-02-10

## Technical Debt

**Large Complex Files:**
- Issue: Several files exceed 300+ lines with mixed concerns
- Files: `app/venue/[id].tsx` (577 lines), `src/services/places.ts` (415 lines), `app/(tabs)/discover.tsx` (405 lines), `src/types/database.ts` (381 lines), `src/components/profile/ProfilePhotos.tsx` (374 lines), `app/user/[id].tsx` (361 lines), `src/components/venue/VenueCard.tsx` (361 lines), `src/hooks/useProfile.ts` (349 lines)
- Impact: Difficult to maintain, test, and debug; high cognitive load for changes
- Fix approach: Extract business logic into services, split UI components into smaller composable units, separate type definitions by domain

**Manual Base64 Decoding:**
- Issue: Custom base64 implementation in profile photo handling
- Files: `src/hooks/useProfile.ts` (lines 22-45)
- Impact: Potential encoding bugs, reinventing the wheel
- Fix approach: Use standard library or well-tested npm package for base64 operations

**Proximity Validation Inconsistency:**
- Issue: Check-in proximity validation is client-side only (50m threshold)
- Files: `app/venue/[id].tsx` (lines 65-66), `src/components/venue/VenueCard.tsx` (lines 47-48)
- Impact: Can be bypassed; no server-side validation prevents fake check-ins
- Fix approach: Move proximity validation to database RPC function `check_in_to_place`, return error if user location is > 50-100m from venue coordinates

**Excessive Console Logging:**
- Issue: 23+ `console.*` statements throughout codebase
- Files: Throughout `app/` and `src/` directories
- Impact: Noise in production logs, potential performance impact, no structured logging
- Fix approach: Replace with structured logging service (e.g., Sentry) or remove in production builds

## Known Issues

**No TODO/FIXME Comments Found:**
- No explicit TODO/FIXME/HACK comments detected
- This is actually good, but may indicate incomplete features are not marked

**Missing Error Context:**
- Issue: Many try/catch blocks catch errors but only log to console without user feedback
- Files: `src/hooks/useProfile.ts` (lines 90-92, 107-109), `app/(tabs)/discover.tsx` (lines 75-77), `app/venue/[id].tsx` (lines 78-82)
- Impact: Silent failures lead to poor UX, hard to debug issues
- Fix approach: Surface errors to users via toast/alert, add error tracking service

**Incomplete Check-In Auto-Checkout:**
- Issue: No automatic checkout mechanism when user leaves venue
- Files: `src/hooks/useCheckIn.ts` (check-in function exists but no auto-checkout)
- Symptoms: Users remain "checked in" indefinitely unless manually checking out
- Fix approach: Implement background location monitoring or time-based auto-checkout (e.g., 4 hours)

## Security Concerns

**Environment Variable Fallback to Empty String:**
- Risk: API keys fall back to empty string if not set, causing runtime failures instead of build-time errors
- Files: `src/services/supabase.ts` (lines 5-6), `src/services/places.ts` (line 11)
- Current mitigation: None - app will fail silently or at runtime
- Recommendations: Throw error at initialization if critical env vars are missing; validate env vars at build time

**Dev Auth Bypass:**
- Risk: `EXPO_PUBLIC_DEV_SKIP_AUTH` bypasses authentication entirely
- Files: `src/hooks/useAuth.ts` (lines 17-84)
- Current mitigation: Only active when `__DEV__ === true`
- Recommendations: Ensure this flag is never enabled in production builds; add warning logs when active

**Client-Side Photo Validation Only:**
- Risk: Photo upload validation happens client-side; no server-side file type/size validation visible
- Files: `src/hooks/useProfile.ts` (photo upload logic)
- Current mitigation: File extension detection from MIME type
- Recommendations: Add server-side validation in Supabase storage policies or edge functions

## Performance Bottlenecks

**Venue Filtering on Client:**
- Problem: Large venue lists filtered and scored client-side
- Files: `src/services/places.ts` (lines 140-175), `src/services/venueScoring.ts`
- Cause: Radar API returns all venues, then client applies nightlife scoring and blacklist filtering
- Improvement path: Pre-filter venues server-side or cache scored results; implement pagination

**Missing Memoization in Large Lists:**
- Problem: Venue lists and user discovery re-render without optimization
- Files: `app/(tabs)/discover.tsx` (venueUsers list), `app/(tabs)/index.tsx` (venues list)
- Cause: No `useMemo` or `React.memo` for expensive computations or large list items
- Improvement path: Memoize filtered/sorted lists, optimize FlatList renderItem with `React.memo`

**Photo Upload Without Compression:**
- Problem: Photos uploaded at full resolution without client-side compression
- Files: `src/hooks/useProfile.ts` (photo upload), `src/components/profile/ProfilePhotos.tsx`
- Cause: `expo-image-picker` may return large images; no compression before upload
- Improvement path: Add image compression library (expo-image-manipulator) to resize before upload

## Fragile Areas

**Drink Relation State Logic:**
- Files: `src/services/drinks.ts` (lines 39-96)
- Why fragile: Complex nested conditionals mapping drink status to UI state; easy to miss edge cases
- Safe modification: Add unit tests for all state transitions before changing logic
- Test coverage: No tests detected for this critical feature

**Type Casting and Nullability:**
- Files: `src/hooks/useCheckIn.ts` (line 49: `(data as any).venues`), `app/(tabs)/discover.tsx` (line 74: `as VenueUser[]`)
- Why fragile: Type assertions bypass TypeScript safety; can cause runtime crashes if data shape changes
- Safe modification: Define proper return types for Supabase RPC functions; avoid `as any`
- Test coverage: None

**Venue Photo URL Handling:**
- Files: `app/venue/[id].tsx` (lines 54-56)
- Why fragile: Fallback logic for `photo_urls` vs `photo_url` indicates inconsistent data shape
- Safe modification: Normalize venue data at API boundary; ensure consistent photo structure
- Test coverage: None

## Scaling Limits

**Radar API Radius Limit:**
- Current capacity: 10km search radius (Radar API max)
- Limit: Cannot discover venues beyond 10km without multiple API calls
- Scaling path: Implement venue caching in Supabase; pre-populate local venues for target region (Dourados, MS)

**Drink Relations Query Performance:**
- Current capacity: Queries up to 300 most recent drinks per user
- Files: `src/services/drinks.ts` (line 71: `.limit(300)`)
- Limit: Performance degrades as user accumulates more drink history
- Scaling path: Add pagination; index on `sender_id`, `receiver_id`, and `created_at`; archive old drinks

**Check-In Store Not Persisted:**
- Current capacity: Check-in state lost on app restart
- Files: `src/stores/checkInStore.ts` (no persistence layer)
- Limit: User must re-fetch active check-in on every app launch
- Scaling path: Add Zustand persistence middleware with AsyncStorage

## Dependencies at Risk

**React Native 0.81.5 (Pre-release):**
- Risk: Using pre-release version may have stability issues
- Impact: Potential crashes, missing features, breaking changes
- Migration plan: Monitor for stable 0.81.x release; consider downgrading to 0.76 LTS if issues arise

**No Test Framework:**
- Risk: No testing dependencies in `package.json`
- Impact: Cannot write automated tests; regression risk on every change
- Migration plan: Add Jest + React Native Testing Library for unit/integration tests

## Missing Critical Features

**No Realtime Implementation:**
- Problem: Supabase Realtime mentioned in AGENTS.md as required for offers/check-ins but not implemented
- Blocks: Real-time drink offer notifications, live check-in updates, venue user list updates
- Priority: High - core MVP feature per spec
- Files: No files found with `subscribe`, `channel`, or realtime logic

**No Automated Testing:**
- Problem: Zero test files detected (`.test.*` or `.spec.*`)
- Blocks: Safe refactoring, CI/CD pipeline, regression prevention
- Priority: High - critical for production app
- Files: No test files exist

**Missing Checkout Functionality:**
- Problem: Check-in exists but no checkout UI or logic
- Blocks: User cannot manually leave venue; no check-in duration tracking
- Priority: Medium - impacts user control and data accuracy
- Files: `src/hooks/useCheckIn.ts` has `checkInToPlace` but no `checkOutFromPlace`

## Test Coverage Gaps

**Authentication Flow:**
- What's not tested: OTP send/verify, onboarding completion, session persistence
- Files: `src/hooks/useAuth.ts`, `src/services/auth.ts`
- Risk: Auth failures in production undetected until user reports
- Priority: High

**Check-In Proximity Validation:**
- What's not tested: Distance calculation, 50m threshold enforcement
- Files: `app/venue/[id].tsx` (lines 65-66), `src/hooks/useCheckIn.ts`
- Risk: Users could fake check-ins by spoofing location
- Priority: High

**Drink Offer State Machine:**
- What's not tested: All state transitions (none → sent → accepted → matched)
- Files: `src/services/drinks.ts`
- Risk: Broken drink offers lead to poor core experience
- Priority: High

**Venue Scoring and Filtering:**
- What's not tested: Nightlife score calculation, blacklist filtering
- Files: `src/services/venueScoring.ts`, `src/services/places.ts`
- Risk: Wrong venues shown to users, poor discovery experience
- Priority: Medium

**Photo Upload and Storage:**
- What's not tested: Base64 conversion, file extension detection, upload flow
- Files: `src/hooks/useProfile.ts` (lines 22-280)
- Risk: Photo upload failures, corrupt images
- Priority: Medium

---

*Concerns audit: 2026-02-10*
