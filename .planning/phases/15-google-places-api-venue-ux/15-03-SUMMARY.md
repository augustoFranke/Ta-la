---
phase: 15-google-places-api-venue-ux
plan: "03"
subsystem: venue-ui
tags: [venue, check-in, ux, bottom-sheet]
dependency_graph:
  requires: ["15-01"]
  provides: ["VenueCard-v2", "CheckInModal-bottom-sheet"]
  affects: ["app/venue/[id].tsx", "src/components/venue/VenueCarousel.tsx"]
tech_stack:
  added: []
  patterns:
    - "Distance-gated check-in button with 3 states (disabled/active/checked-in)"
    - "Lightweight Modal bottom sheet with animationType=slide"
key_files:
  created: []
  modified:
    - src/components/venue/VenueCard.tsx
    - src/components/venue/CheckInModal.tsx
    - src/components/venue/VenueCarousel.tsx
    - app/venue/[id].tsx
decisions:
  - "Check-in always public — no visibility or open_to_meeting toggles in UI"
  - "10m threshold for enabled check-in button"
  - "Distance shown only when <500m, formatted as raw meters"
metrics:
  duration: "12 minutes"
  completed_date: "2026-02-19"
  tasks_completed: 2
  files_modified: 4
requirements:
  - VENUE-UX-02
  - VENUE-UX-03
  - VENUE-UX-04
  - VENUE-UX-05
---

# Phase 15 Plan 03: VenueCard Rebuild and CheckInModal Bottom Sheet Summary

**One-liner:** Rebuilt VenueCard with hero photo header + distance-gated check-in button, replaced CheckInModal's toggle-heavy modal with a slide-up bottom sheet confirming always-public check-in.

## What Was Built

### Task 1: VenueCard Rebuild (f9e4950)

Fully rewrote `VenueCard.tsx` with the new layout:

- **Hero photo** occupies top ~65% of card height (`CARD_HEIGHT = 320`, hero = 208px)
- **Venue name** (20px bold) below photo in white/card background section
- **Distance** shown only when `venue.distance * 1000 < 500`; formatted as `${Math.round(meters)}m`
- **Check-in button** full-width at bottom with 3 states:
  - `isAlreadyCheckedIn` → "Sair" (red/error background)
  - `isTooFar` (distanceMeters > 10, not checked in) → "Você está longe" (border bg, disabled)
  - else → "Fazer check-in" (primary bg)
- **Removed:** rating stars, openStatus badge, card-level `onPress`/TouchableOpacity
- **Kept:** `CARD_WIDTH`, `CARD_HEIGHT` exports; `active_users_count` and `open_to_meeting_count` badges
- **Props:** `activeCheckInPlaceId`, `onCheckIn`, `onCheckOut` (removed old `onPress`)

**Auto-fixed (Rule 1):** `VenueCarousel.tsx` used the removed `onPress` prop — updated to pass `activeCheckInPlaceId`/`onCheckIn`/`onCheckOut` instead.

### Task 2: CheckInModal Bottom Sheet (092acfb)

Rewrote `CheckInModal.tsx` as lightweight bottom sheet:

- `Modal` with `animationType="slide"`, transparent
- Full-screen overlay tap to dismiss
- Bottom sheet: drag handle, venue name, address (if present), confirm button, cancel link
- **Removed:** Switch, `openToMeeting` state, visibility selector (3 options)
- **`onConfirm` takes no args** — always public check-in
- Updated `app/venue/[id].tsx` `handleConfirmCheckIn` to no-arg signature, hardcodes `open_to_meeting: true, visibility: 'public'`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] VenueCarousel used removed `onPress` prop**
- **Found during:** Task 1 TypeScript check
- **Issue:** `VenueCarousel.tsx` passed `onPress={onVenuePress}` to VenueCard; prop was removed in the rebuild
- **Fix:** Updated `VenueCarouselProps` and render function to use `activeCheckInPlaceId`, `onCheckIn`, `onCheckOut`
- **Files modified:** `src/components/venue/VenueCarousel.tsx`
- **Commit:** f9e4950

## Self-Check: PASSED

- `src/components/venue/VenueCard.tsx` — exists
- `src/components/venue/CheckInModal.tsx` — exists
- `src/components/venue/VenueCarousel.tsx` — exists (updated)
- `app/venue/[id].tsx` — exists (updated)
- Commits f9e4950 and 092acfb — verified in git log
- `npx tsc --noEmit` — passes
