# Tá lá! — Spec 004: Home screen, venue discovery & trending

## 1) Problem statement (why)
Users need a fast, clear way to discover nearby venues, understand popularity (“Trending”), and see check-in availability.

## 2) Scope
**In scope**
- Home header UI
- “Near you” carousel + placeholders
- dynamic radius expansion
- trending top 5 last week

**Out of scope**
- venue search input
- venue detail pages (v1)

## 3) Users & workflows
**Happy path**
1. User opens Home.
2. Sees greeting + header controls.
3. Scrolls nearby venues carousel.
4. Sees Trending list if data exists.

## 4) Functional requirements
### Header (MUST)
Home **MUST** display:
- small user photo top-left (logged in) or generic avatar (guest)
- greeting:
  - logged in: “Hello, {user name}!”
  - guest: “Hello!”
- notification bell top-right

### Near you carousel (MUST)
- Title: **“Near you”**
- Venue card **MUST** include:
  - venue name
  - venue image
  - CTA button state:
    - “You’re far away” if outside venue radius
    - “Check in” only if within radius AND user verified
    - “Verify your profile to check in” if within radius but not verified
  - if venue has active check-ins: show people-count badge/icon

### Radius expansion (MUST)
- If no venues found within initial radius (default 2km):
  - expand automatically through configured steps until venues found or max reached
- If still none:
  - show placeholder: “We couldn’t find bars near you…”

### Trending (MUST)
- Show Trending section only if at least 1 venue has check-ins in the last 7 days.
- Trending must display:
  - flame icon + title “Trending”
  - top 5 venues by check-ins in last 7 days
  - each item shows: rank, small image left, venue name, and average formatted as “X / day”
- If no trending data:
  - do not render title or list.

## 5) Acceptance criteria (Given/When/Then)
- Given no venues in 2km but venues exist within 10km  
  When Home loads  
  Then it expands radius until venues are found and shows them.

- Given no venues even after max radius  
  When Home loads  
  Then it shows the placeholder text.

- Given trending data exists  
  When Home loads  
  Then it shows 1–5 items (max 5), ordered descending by check-ins.

## 6) Data & contracts
- “Near you” requires user location and venue geofence metadata.
- Trending requires aggregated check-in counts by day for last 7 days.

## 7) Non-functional requirements
- Home scrolling must remain smooth (target 60fps on mid-tier).
- Venue list load P95 ≤ **1.5s** after location acquired.

## 8) Definition of Done
- UI tests for all placeholders and empty states.
- Verification-gated CTA states tested (guest/registered/unverified/verified).
