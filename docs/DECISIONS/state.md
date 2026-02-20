# ADR: State

## Status
Accepted

## Date
2026-02-19

## Context
The app needs lightweight global state across auth, location, check-in, venue, moderation, and notifications without heavy boilerplate.

## Decision
Use Zustand stores as the global state layer, including `.getState()` access in non-component flows (for example, logout orchestration).

## Consequences
- Low-friction state updates with simple store boundaries.
- Non-reactive calls must be used carefully to avoid stale assumptions.
- Store reset semantics become part of auth lifecycle design.

## Evidence
- `src/stores/`
- `src/hooks/useAuth.ts`
- `.planning/phases/14-cleanup-navigation-restructure/14-01-SUMMARY.md`

