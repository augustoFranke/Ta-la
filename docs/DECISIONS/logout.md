# ADR: Logout

## Status
Accepted

## Date
2026-02-19

## Context
Logout had stale user-scoped state leaking across sessions.

## Decision
On logout, reset user-scoped stores but preserve the venue list cache; clear only selected venue.

## Consequences
- Prevents cross-user state leakage after sign-out.
- Faster post-login experience due to preserved shared venue cache.
- Requires clear separation between user-scoped and global cache state.

## Evidence
- `.planning/phases/14-cleanup-navigation-restructure/14-01-SUMMARY.md`
- `src/hooks/useAuth.ts`
- Git commit: `8cf4830`

