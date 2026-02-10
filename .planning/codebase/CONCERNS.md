# Codebase Concerns

**Analysis Date:** 2026-02-10

## Tech Debt

**Monolithic screen components:**
- Issue: Large page components mix data access, business rules, and UI rendering in single files.
- Files: `app/venue/[id].tsx`, `app/(tabs)/discover.tsx`, `app/user/[id].tsx`, `app/(tabs)/index.tsx`
- Impact: Changes are high-risk, review is slow, and regressions are likely when touching unrelated behavior.
- Fix approach: Extract data hooks/services (favorites, drink actions, venue state), then keep screens focused on presentation and navigation.

**Type safety erosion in data paths:**
- Issue: Frequent `any` casts and loose typing around auth/session and Supabase responses.
- Files: `src/hooks/useAuth.ts`, `src/hooks/useCheckIn.ts`, `src/hooks/useProfile.ts`, `src/types/database.ts`, `src/components/ui/Button.tsx`
- Impact: Runtime failures are easier to introduce and harder to detect during refactors.
- Fix approach: Replace `any` with explicit DTO types and typed Supabase query helpers; tighten `Database` typing in `src/types/database.ts`.

**Schema types are incomplete versus runtime usage:**
- Issue: The `Database` type only models `users` while runtime code depends on many additional tables/functions.
- Files: `src/types/database.ts`, `src/hooks/useCheckIn.ts`, `src/services/drinks.ts`, `app/venue/[id].tsx`, `app/(tabs)/discover.tsx`
- Impact: Compile-time guarantees do not protect core features (check-ins, drinks, favorites), increasing production defect risk.
- Fix approach: Regenerate and commit full Supabase types, then use them across hooks/services.

## Known Bugs

**Favorite venues table is referenced but not defined in migrations:**
- Symptoms: Favoriting can fail at runtime with relation-not-found errors when DB does not already contain `user_favorite_places`.
- Files: `app/venue/[id].tsx`, `supabase/migrations/`
- Trigger: Open a venue and toggle favorite in an environment built only from repository migrations.
- Workaround: Manually create `user_favorite_places` in DB outside this repo.

**Check-in RPC is called but not present in repository migrations:**
- Symptoms: Check-in flow can fail with RPC-not-found errors for `check_in_to_place`.
- Files: `src/hooks/useCheckIn.ts`, `supabase/migrations/`
- Trigger: Execute check-in in an environment provisioned strictly from current SQL migrations.
- Workaround: Create/restore `check_in_to_place` directly in the target DB.

## Security Considerations

**Shared venue metadata is writable by any authenticated user:**
- Risk: Any signed-in user can mutate or delete shared `venue_metadata` records due permissive `FOR ALL USING (true)` policy.
- Files: `supabase/migrations/019_fix_venue_metadata_rls_v2.sql`, `supabase/migrations/017_create_venue_filtering.sql`
- Current mitigation: `WITH CHECK (auth.uid() IS NOT NULL)` blocks anonymous writes only.
- Recommendations: Restrict write access to `service_role` or narrowly scoped RPCs; remove broad `FOR ALL` user policy.

**Client-side distance gate is visible but server-side validation is not versioned here:**
- Risk: A modified client can bypass the 50m UI guard and attempt remote check-ins unless the backend RPC enforces geofence.
- Files: `app/venue/[id].tsx`, `src/hooks/useCheckIn.ts`, `supabase/migrations/`
- Current mitigation: UI disables check-in when `distanceMeters > 50`.
- Recommendations: Enforce distance validation inside `check_in_to_place` SQL and keep that function in repository migrations.

## Performance Bottlenecks

**Quadratic deduplication in venue search pipeline:**
- Problem: Venue dedupe uses `reduce` + `find`, producing O(n^2) behavior as result sets grow.
- Files: `src/services/places.ts`
- Cause: `uniqueVenues` is built with repeated linear scans.
- Improvement path: Deduplicate with a `Map`/`Set` keyed by `place_id` in one pass.

**High-frequency relation refresh with broad drink query:**
- Problem: Drink state reload can pull up to 300 rows repeatedly during search/user list updates.
- Files: `app/(tabs)/discover.tsx`, `app/user/[id].tsx`, `src/services/drinks.ts`
- Cause: `fetchDrinkRelations` runs on changing target lists and queries `drinks` with `.or(...).limit(300)` before client-side filtering.
- Improvement path: Add server-side filtered RPC for specific target IDs and fetch only latest relation per pair.

**Potentially expensive ILIKE user search without dedicated index strategy:**
- Problem: Name search uses `%term%` matching which degrades on larger `users` tables.
- Files: `app/(tabs)/discover.tsx`, `supabase/migrations/002_create_users.sql`
- Cause: No migration defines trigram/functional index for name search patterns.
- Improvement path: Add trigram index (`pg_trgm`) or searchable normalized column and query strategy aligned with index.

## Fragile Areas

**Database migration drift versus app assumptions:**
- Files: `src/hooks/useCheckIn.ts`, `app/venue/[id].tsx`, `supabase/migrations/`
- Why fragile: Core runtime dependencies (`check_in_to_place`, `user_favorite_places`) are not reproducible from repo migrations.
- Safe modification: Add missing migrations first, then refactor frontend calls with typed contracts.
- Test coverage: No automated DB integration tests detected in repository.

**Global stores are not comprehensively reset on logout:**
- Files: `src/hooks/useAuth.ts`, `src/stores/authStore.ts`, `src/stores/checkInStore.ts`, `src/stores/venueStore.ts`
- Why fragile: `signOut` resets auth store but does not explicitly reset check-in/venue stores, allowing stale local state windows.
- Safe modification: Centralize logout cleanup and reset all user-scoped stores atomically.
- Test coverage: No store-level logout/reset tests detected.

## Scaling Limits

**Venue discovery payload cap and client-side ranking:**
- Current capacity: At most 100 venues returned from Radar request (`limit=100`) then sorted/deduped in-app.
- Limit: Dense areas can exceed cap, causing partial venue visibility and unstable ranking under growth.
- Scaling path: Move ranking/filtering to backend service with pagination/cursor support.

**Drink relation loading cap:**
- Current capacity: `fetchDrinkRelations` processes up to 300 drink rows per call.
- Limit: Relationship history growth can hide relevant state beyond cap and increase latency.
- Scaling path: Replace broad history fetch with pairwise latest-status query/RPC and DB indexes for sender+receiver lookups.

## Dependencies at Risk

**Not detected:**
- Risk: No dependency deprecation or unsupported package risk is encoded in repository metadata reviewed.
- Impact: Not applicable from current source snapshot.
- Migration plan: Reassess with periodic `npm audit` and SDK compatibility checks in CI.

## Missing Critical Features

**Automated quality gates for regressions:**
- Problem: There are no test files, test runner configs, or test scripts to protect core flows.
- Blocks: Safe refactoring of auth, check-in, drinks, and venue discovery logic.

## Test Coverage Gaps

**Authentication and onboarding flows are untested:**
- What's not tested: OTP send/verify paths, onboarding completion writes, and logout state cleanup.
- Files: `src/hooks/useAuth.ts`, `app/(auth)/verify.tsx`, `app/(auth)/onboarding/photos.tsx`
- Risk: User access and profile creation regressions can ship undetected.
- Priority: High

**Check-in and venue discovery paths are untested:**
- What's not tested: location permission bootstrap, venue fetch/cache behavior, check-in RPC integration, and proximity gating.
- Files: `src/hooks/useCheckIn.ts`, `src/hooks/useVenues.ts`, `src/services/places.ts`, `app/venue/[id].tsx`, `app/(tabs)/index.tsx`
- Risk: Core MVP experience can silently degrade in production.
- Priority: High

**Drink relation logic is untested:**
- What's not tested: relation state precedence, accept/decline transitions, and UI actions across discover/profile screens.
- Files: `src/services/drinks.ts`, `app/(tabs)/discover.tsx`, `app/user/[id].tsx`
- Risk: False positives/negatives in match state and inconsistent interaction UX.
- Priority: High

---

*Concerns audit: 2026-02-10*
