# ADR: Routing

## Status
Accepted

## Date
2026-02-19

## Context
The app relies on file-based routing, and Expo Router auto-registers tab routes from files.

## Decision
Keep Expo Router as the routing system and suppress unwanted tab auto-registration with `href: null` instead of deleting route files prematurely.

## Consequences
- Routing stays aligned with Expo-native conventions.
- Hidden tabs can remain available for future reactivation.
- Layout config must explicitly control visibility to avoid accidental extra tabs.

## Evidence
- `.planning/phases/14-cleanup-navigation-restructure/14-02-SUMMARY.md`
- `app/(tabs)/_layout.tsx`
- Git commit: `11fd041`

