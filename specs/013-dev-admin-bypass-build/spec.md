# Tá lá! — Spec 013: Local-only DEV/ADMIN/MASTER bypass build (must never ship)

## 1) Problem statement (why)
Developers need to test flows locally without completing verification, while ensuring bypass cannot ship to production.

## 2) Scope
**In scope**
- A dedicated local development build/profile that bypasses requirements
- Protections preventing production shipping

## 3) Users & workflows
- Developer runs local build and can simulate all states without errors.

## 4) Functional requirements
### DEV bypass build (MUST)
A dedicated build/profile must exist that:
- bypasses login, email verification, profile verification, and check-in gating
- allows navigation to all screens without errors
- provides a way to simulate key states (guest, registered, verified, checked-in, matched) without requiring external dependencies

### Must never ship (MUST)
Production builds must hard-disable bypass:
- no bypass toggle reachable in production builds
- CI must fail if bypass is enabled for production configuration
- defense-in-depth: even if a flag is toggled at runtime, production build must ignore it

## 5) Acceptance criteria (Given/When/Then)
- Given a DEV build  
  When bypass is enabled  
  Then developer can access feed/chat/settings without completing verification.

- Given a production build  
  When attempting to locate bypass features  
  Then none exist and CI assertions confirm bypass is disabled.

## 6) Data & contracts
- DEV bypass must not write to real production data by default (recommended: isolated/local environment).

## 7) Non-functional requirements
- Zero bypass code paths reachable in production (verified by automated checks).

## 8) Definition of Done
- Automated CI gate prevents shipping production with bypass.
- DEV build demonstrates bypass access across all gated screens.
