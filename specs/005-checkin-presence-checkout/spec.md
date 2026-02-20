# Tá lá! — Spec 005: Check-in lifecycle, presence & checkout

## 1) Problem statement (why)
Check-in must be trustworthy (location-based), consented, reversible, and must not leak visibility accidentally.

## 2) Scope
**In scope**
- Eligibility for check-in by distance + location accuracy
- Confirmation prompt with visibility reminder
- Venue feed entry after check-in
- Checkout confirmation
- Background behavior and auto-checkout rules

**Out of scope**
- Multi-venue simultaneous check-in (v1: at most one active check-in).

## 3) Users & workflows
**Happy path**
1. Verified user within venue radius sees “Check in”.
2. Presses → sees confirmation + reminder.
3. Confirms → becomes checked-in and sees venue feed.
4. Back arrow → confirms checkout → returned to Home.

## 4) Functional requirements
### Eligibility (MUST)
Check-in requires:
- location permission granted
- location accuracy ≤ **50m**
- user within venue check-in radius (default 100m; per-venue override allowed)
- user status is `verified`
- location freshness ≤ **120 seconds**

If any requirement fails, CTA must not be “Check in” and must show the correct gating message.

### Confirmation (MUST)
On “Check in” press, show modal with:
- reminder: **“Your profile will be visible to other people at this venue.”**
- confirm + cancel

### Presence (MUST)
On confirm:
- user becomes visible in venue presence list
- user enters the “people at venue” feed screen

### Checkout (MUST)
Back arrow from feed:
- show message: **“You will check out of the venue and will no longer be able to view other users.”**
- require confirmation
On confirm:
- user removed from venue list and loses feed access

### Background behavior (MUST)
- If user backgrounds app (not killed): user remains checked-in.
- If app is killed or user signs out: user must be checked out.

### Auto-checkout (MUST)
- If no valid location update for **30 minutes** → checkout
- If user is outside venue radius continuously for **10 minutes** → checkout
- Auto-checkout accuracy window: should occur within ±2 minutes of thresholds

### Abuse prevention (MUST)
- Prevent rapid toggling: max **5 check-in/out events per 10 minutes**; otherwise throttle with user-friendly message.

## 5) Acceptance criteria (Given/When/Then)
- Given a verified user within radius with good accuracy and fresh location  
  When they confirm check-in  
  Then they are marked present and see the venue user feed.

- Given a checked-in user confirms checkout  
  When checkout completes  
  Then they are removed from presence and cannot view feed.

### Edge/fail cases
- Accuracy worsens mid-session → continue until stale timeout; then checkout.
- Venue geofence missing → disable check-in and show “Venue temporarily unavailable”.
- Network loss at confirm:
  - show pending state; do not show feed until confirmed
  - if fails, show “Couldn’t check in” and revert state

## 6) Data & contracts
Check-in record must include:
- user id
- venue id
- check-in timestamp
- last location timestamp
- checkout timestamp/reason (manual, out_of_range, stale_location, app_killed, signout)

## 7) Non-functional requirements
- Check-in confirm → feed display P95 ≤ **2.0s**.
- No duplicate check-in records due to retries (idempotent confirm).

## 8) Definition of Done
- E2E: eligible check-in, ineligible states, checkout confirm, background/resume, kill/signout checkout, auto-checkout.
