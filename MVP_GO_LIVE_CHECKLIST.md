i# MVP Go-Live Checklist (Tá lá!)

## Release Gate
- [ ] All items in sections 1-6 completed
- [ ] No P0/P1 open bugs
- [ ] Smoke test validated in real network environment (device or CI runner)

## 1. Core Product Flow (Check-in -> Descobrir -> Drink)
- [x] User can check-in at venue with proximity enforcement
- [x] After check-in, app offers immediate navigation to `Descobrir`
- [x] `Descobrir` shows people at same venue
- [x] User can send drink offer from discovery/profile
- [x] User can accept/decline incoming drink offer
- [x] UI shows drink status feedback (`enviado`, `recebido`, `aceito`, `conectados`)
- [ ] End-to-end manual test on iOS/Android with two real accounts

## 2. Type Safety and Build Health
- [x] `npx tsc --noEmit` passes
- [x] Required UI dependencies installed (`@expo/vector-icons`)
- [ ] `npm start` boot sanity-check completed on Expo Go

## 3. API and Infrastructure Validation
- [ ] Supabase reachable and authenticated from runtime environment
- [ ] Google Places requests returning `OK` for production key
- [ ] Upstash Redis read/write checks passing
- [ ] PostHog event ingestion confirmed in project dashboard
- [ ] Re-run `node smoke-test.js` outside sandboxed network

## 4. Supabase Data Safety
- [ ] All migrations applied in order on staging/prod
- [ ] RLS policies validated for `users`, `check_ins`, `drinks`, `matches`, `photos`, `interests`
- [ ] Verify drink acceptance + reciprocal acceptance creates match exactly once
- [ ] Verify no unauthorized update/delete across users

## 5. UX and Error Handling
- [x] User-facing errors in pt-BR for core actions
- [ ] Offline/network interruption messaging verified on device
- [ ] Empty/loading/error states visually consistent across core screens

## 6. Launch Ops
- [ ] `.env` production values finalized and audited
- [ ] App version/build number bumped
- [ ] Release notes prepared (MVP scope only)
- [ ] Rollback plan documented

## Manual QA Script (Must Pass)
- [ ] Account A + B complete onboarding
- [ ] A check-in at venue (within radius)
- [ ] B check-in at same venue
- [ ] A sees B in `Descobrir`
- [ ] A sends drink to B
- [ ] B sees incoming drink and accepts
- [ ] A sees accepted status and sends reciprocal drink
- [ ] Both see connected status
- [ ] Logout/login retains expected state
