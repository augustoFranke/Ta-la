# Tá lá! — Spec 008: Notifications (in-app + push)

## 1) Problem statement (why)
Users must be notified promptly for key interaction events so they don’t miss matches or responses.

## 2) Scope
**In scope**
- In-app notifications tab
- OS-level push notifications
- Events:
  - mutual like
  - offer accepted
  - offer rejected
  - like received

## 3) Users & workflows
1. Event occurs.
2. Notification appears in-app and via push (if enabled).
3. User taps notification to navigate to relevant screen.

## 4) Functional requirements
- Each event must generate:
  - one in-app notification item
  - one push notification (if permissions granted)
- Notifications tab must show:
  - timestamp
  - type (like received / match / offer accepted / offer rejected)
  - deep link action

### Failure handling (MUST)
- If push permission denied:
  - still create in-app notification
- If device token invalid/unregistered:
  - retry with backoff; do not break in-app notifications
- Notifications must be idempotent: no duplicates on retries.

## 5) Acceptance criteria (Given/When/Then)
- Given a mutual like  
  When match is created  
  Then both users receive in-app + push notifications.

- Given push is disabled  
  When a like is received  
  Then only in-app notification appears and no push failures are user-visible.

## 6) Data & contracts
- Notification items must persist across sessions.
- Read/unread state must persist.

## 7) Non-functional requirements
- Push delivery SLO: P95 ≤ **30s** after event.
- Notifications list load P95 ≤ **1s**.

## 8) Definition of Done
- Automated tests: each event → in-app created; push-disabled path; deep link correctness.
