# Tá lá! — Spec 002: Account creation & email verification

## 1) Problem statement (why)
Users must register securely and confirm their email to reduce spam, impersonation, and low-trust accounts.

## 2) Scope
**In scope**
- Sign up with Google OR email/password.
- Email confirmation required before “account active”.

**Out of scope**
- Other login methods beyond Google/email.
- Passwordless login.

## 3) Users & workflows
**Happy path: email/password**
1. User enters email + password.
2. Account created in “email unconfirmed” state.
3. Verification email sent.
4. User clicks verification link.
5. Account becomes “email confirmed” and can proceed to Profile Creation.

**Happy path: Google**
1. User chooses Google sign-in.
2. If provider asserts the Google email is verified, the app **MUST** treat email as confirmed.

## 4) Functional requirements
- The system **MUST** support account creation via:
  - Google
  - email + password
- Email confirmation **MUST** be required before enabling:
  - profile verification steps
  - check-in functionality
  - user-to-user interactions (likes, offers, chat)
- Verification link **MUST** expire after **24 hours**.
- Users **MUST** be able to request “resend verification email”.
- Password requirements **MUST** include:
  - minimum length **10**
  - at least **1 uppercase**, **1 lowercase**, **1 number**
  - reject common weak/breached-password patterns (at minimum: “password”, “123456”, and passwords containing the email local-part)

### Failure and abuse controls
- The system **MUST** rate-limit signup and login attempts:
  - login rate limit: **5 attempts / 10 min** per email + IP/device (configurable)
- The system **MUST NOT** reveal whether an email already exists (no enumeration). Use neutral copy:  
  “If an account exists, we sent an email.”

## 5) Acceptance criteria (Given/When/Then)
- Given a new email/password sign-up  
  When the account is created  
  Then user status is “email unconfirmed”, and an email verification is sent.

- Given an unconfirmed email account  
  When user attempts to proceed to profile verification  
  Then the system blocks with “Confirm your email to continue”.

- Given a verification link older than 24 hours  
  When clicked  
  Then verification fails with “Link expired” + CTA to resend.

### Edge cases
- User signs up, deletes app, reinstalls, logs in without confirming email → still blocked until confirmed.
- User requests resend repeatedly → throttled + messaging to wait.

## 6) Data & contracts
- Account states **MUST** include at minimum:
  - `email_unconfirmed`, `email_confirmed`
- Audit events **MUST** be recorded for:
  - signup
  - verification sent
  - verification success/failure
  - resend attempts (including throttles)

## 7) Non-functional requirements
- Verification email “sent” acknowledgement in-app ≤ **2s** after request (even if delivery is later).
- Auth flows must be resilient to intermittent network loss (retry + clear messaging).

## 8) Definition of Done
- E2E: email sign-up, verify success, verify expiry, resend.
- Security verification: no user enumeration via error messages or timing.
