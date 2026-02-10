# Ta la

## What This Is

Ta la is a location-based social mobile app for people in Dourados, MS, Brazil to discover venues, check in when physically present, and find other users at the same place. The app combines nearby venue discovery, presence validation, and lightweight social interactions around drinks and profiles. It targets a fast MVP loop on Expo + Supabase.

## Core Value

People can reliably discover who is at the same venue right now, with trustworthy proximity-based check-in.

## Requirements

### Validated

- ✓ User can authenticate via Supabase OTP/email flow and persist session state — existing
- ✓ User can complete onboarding (photos, bio, interests, preferences) and access tab experience — existing
- ✓ User can browse nearby venues with location permissions and venue detail navigation — existing
- ✓ User can perform venue-based check-in and see users in the same venue from discover flow — existing
- ✓ User can view and edit profile information and photos — existing

### Active

- [ ] Improve reliability and reproducibility of DB-backed check-in/favorites flows from repository migrations
- [ ] Add quality gates for critical flows (auth, check-in, discovery, drink relations)
- [ ] Tighten type safety and data contracts across hooks/services/stores

### Out of Scope

- In-app chat/messaging for MVP — explicitly excluded in current scope
- Venue vibes/dating score for MVP — deferred until core loop is stable
- Development-build-only native workflows — constrained to Expo Go / EAS Preview approach

## Context

- Current codebase is brownfield and already implements core route groups in `app/(auth)/` and `app/(tabs)/`.
- Architecture is route-first with domain hooks (`src/hooks/`), Zustand stores (`src/stores/`), and service boundaries (`src/services/`).
- Backend uses Supabase Auth + Postgres migrations in `supabase/migrations/` with RPC-driven check-in/discovery behavior.
- Codebase mapping surfaced migration drift risks (`check_in_to_place` and `user_favorite_places` expectations) and no automated tests.

## Constraints

- **Tech stack**: Keep Expo Router + React Native + TypeScript + Zustand + Supabase — aligns with existing architecture and avoids migration churn
- **Localization**: User-facing copy must remain pt-BR — product target is Dourados, MS users
- **MVP scope**: Prioritize drink offers, check-in, and same-venue discovery — these define immediate product value
- **Check-in integrity**: Presence must validate proximity (50-100m) with backend enforcement expectations — trust in presence is critical
- **Build approach**: Expo Go / EAS Preview only — avoid introducing custom dev-build requirements

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Initialize as brownfield with inferred validated capabilities | Existing app already ships core flows and has codebase map artifacts | — Pending |
| Keep MVP boundaries strict (no chat, no dating score) | Prevent scope creep and focus on validating venue presence loop | — Pending |
| Use auto workflow to generate planning artifacts end-to-end | Faster transition from map to executable phases | — Pending |

---
*Last updated: 2026-02-10 after initialization*
