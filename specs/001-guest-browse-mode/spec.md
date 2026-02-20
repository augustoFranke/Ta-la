# Tá lá! — Spec 001: Guest browse mode (install & first run)

## 1) Problem statement (why)
New users must be able to understand Tá lá! and browse nearby venues **without friction**, while preventing anonymous participation that could enable abuse or privacy leakage.

## 2) Scope
**In scope**
- App opens without login (Guest mode).
- Guest can browse venues near them (read-only).
- All tabs are visible in “read-only browsing mode”.
- Any restricted interaction triggers Account Creation entry.

**Out of scope**
- Venue search (explicitly unavailable).
- Check-in, likes, offers, chat, profile editing, notifications actions.

## 3) Users & workflows
**Personas**
- Guest curious user
- Returning user not logged in (treated as Guest until authenticated)

**Happy path**
1. Install and open app.
2. Home loads in browse mode.
3. Guest views nearby venues carousel.
4. Guest taps a restricted action → redirected to Account Creation.

## 4) Functional requirements (MUST/SHOULD/MAY)
- The app **MUST** load an initial screen without requiring login.
- Guest **MUST** be able to view nearby venues (subject to location permission).
- Guest **MUST NOT** be able to:
  - check in
  - see other users at venues
  - send likes / offer drinks
  - access chat
  - persist changes in settings or profile
- Guest **MUST** be blocked from searching venues (no search UI or entry points).
- Any attempt to perform a restricted action **MUST** route to Account Creation.
- Profile tab in Guest mode **MUST** show a CTA button: **“Register and create profile”**.

## 5) Acceptance criteria (Given/When/Then)
- Given the user is not logged in  
  When the app opens  
  Then Home loads in browse mode without authentication prompts.

- Given a Guest user  
  When they tap “Check in” on any venue card  
  Then they are redirected to Account Creation.

- Given a Guest user  
  When they open Profile tab  
  Then they see only a “Register and create profile” CTA and no editable profile controls.

### Edge/fail cases
- Given location permission is denied  
  When the app opens  
  Then it shows an explanatory placeholder and still allows browsing tabs in read-only mode.

- Given location is unavailable (no GPS / airplane mode)  
  When Home loads  
  Then it shows a “location unavailable” placeholder and does not crash.

## 6) Data & contracts (requirements-level)
- Guest session state **MUST** be “unauthenticated” and treated as read-only.
- The app **MUST NOT** persist any user-generated content (UGC) in Guest mode.

## 7) Non-functional requirements
- First screen **Time-to-Interactive**: ≤ **2.5s** on mid-tier devices.
- No fatal errors if location/notifications permissions are denied.

## 8) Definition of Done
- E2E tests cover: guest open, browse, restricted action → redirect.
- UI verification that no search entry points exist in Guest mode.
- Crash-free validation for denied/unavailable location.
