# Tá lá! — Spec 010: Settings, theme, permissions & account management

## 1) Problem statement (why)
Users need control over privacy, appearance, and account security.

## 2) Scope
**In scope**
- Permissions management entry points
- Theme + primary color
- Change name/email/password/phone
- Delete account
- Sign out

## 3) Users & workflows
1. User opens Settings.
2. Adjusts theme/color.
3. Updates account info.
4. Deletes account or signs out.

## 4) Functional requirements
- Theme options must be exactly:
  - light
  - dark
  - system default
- Default primary color must be: **#aeee5b**
- Settings must provide entry points to manage OS permissions (location, notifications, etc.).
- Users must be able to change:
  - name
  - email (requires re-confirmation)
  - password (requires re-authentication)
  - phone (requires OTP re-verify)
- Users must be able to:
  - sign out
  - delete account

### Account deletion (MUST)
Deletion must:
- revoke access immediately
- invalidate sessions
- remove user from venue presence, chats, matches, and discoverability
- remove or anonymize personal data per privacy policy and LGPD requirements

## 5) Acceptance criteria (Given/When/Then)
- Given a user changes theme  
  When they reopen the app  
  Then theme persists.

- Given a user requests account deletion  
  When completed  
  Then they cannot log in and their data is removed/anonymized per policy.

## 6) Data & contracts
- Settings changes must persist per user.
- Account deletion must emit auditable events.

## 7) Non-functional requirements
- Theme/color changes must work offline and apply instantly.

## 8) Definition of Done
- E2E: theme change persists, sign out works, deletion revokes access and removes user from key surfaces.
