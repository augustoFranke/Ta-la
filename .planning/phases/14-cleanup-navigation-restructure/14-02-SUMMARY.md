---
phase: 14-cleanup-navigation-restructure
plan: "02"
subsystem: navigation
tags: [navigation, tabs, expo-router, chat-placeholder]
dependency_graph:
  requires: []
  provides: [4-tab-layout, chat-placeholder-screen]
  affects: [app/(tabs)/_layout.tsx, app/(tabs)/chat.tsx]
tech_stack:
  added: []
  patterns: [expo-router-href-null-suppression]
key_files:
  created:
    - app/(tabs)/chat.tsx
  modified:
    - app/(tabs)/_layout.tsx
  deleted:
    - app/(tabs)/explore.tsx
decisions:
  - "Suppress discover.tsx with href: null rather than deleting it — Expo Router auto-discovers all files; href: null hides from tab bar without removing file"
metrics:
  duration: "~20 minutes"
  completed: "2026-02-19"
  tasks_completed: 3
  files_changed: 3
---

# Phase 14 Plan 02: Tab Navigation Restructure Summary

**One-liner:** 4-tab navigation (Início, Parceiros, Chat, Minha conta) with Chat placeholder and Explorar removed via Expo Router href: null suppression.

## What Was Built

Restructured the app's tab navigation from 5 tabs to 4 tabs as part of the v2.0 MVP relaunch. The Explorar tab was removed, explore.tsx was deleted, and a new Chat placeholder screen was added. A post-checkpoint fix was required to suppress discover.tsx which Expo Router was auto-registering as a 5th tab.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create Chat placeholder screen (chat.tsx) | 6dab45a |
| 2 | Restructure layout to 4 tabs, delete explore.tsx | 209fb42 |
| 3 | Fix: suppress discover tab with href: null | 11fd041 |

## Decisions Made

- **href: null for discover.tsx** — Expo Router auto-discovers all `.tsx` files in the tabs directory and renders them as tabs. Adding `<Tabs.Screen name="discover" options={{ href: null }} />` suppresses the auto-registered tab without deleting the file, which can be cleaned up in a future phase.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] discover.tsx auto-registered as 5th tab by Expo Router**
- **Found during:** Task 3 (human verification checkpoint)
- **Issue:** The plan stated "discover.tsx can remain on disk — Expo Router will not render it as a tab." This was incorrect: Expo Router auto-discovers all files in the tabs directory and registers them as tabs unless explicitly suppressed in the layout.
- **Fix:** Added `<Tabs.Screen name="discover" options={{ href: null }} />` to _layout.tsx to suppress discover from the tab bar.
- **Files modified:** app/(tabs)/_layout.tsx
- **Commit:** 11fd041

## Self-Check

- [x] app/(tabs)/chat.tsx exists
- [x] app/(tabs)/_layout.tsx has exactly 4 visible tabs (5 Tabs.Screen entries: 4 visible + 1 hidden with href: null)
- [x] app/(tabs)/explore.tsx deleted
- [x] Commits 6dab45a, 209fb42, 11fd041 all exist
- [x] No explore references in _layout.tsx

## Self-Check: PASSED
