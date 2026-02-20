# Tá lá! — Spec 009: My Profile view & edit

## 1) Problem statement (why)
Users need control over their representation while preserving verification integrity.

## 2) Scope
**In scope**
- View profile
- Edit photos, bio/description, preferences
- Verification-impact rules when identity-critical fields change

**Out of scope**
- Advanced visibility controls (v1)

## 3) Users & workflows
1. User opens My Profile.
2. Sees profile + verification badge.
3. Enters edit mode and changes fields.
4. Saves changes.

## 4) Functional requirements
- User must be able to edit:
  - bio/description
  - photos (subject to minimum counts)
  - partner preference and related fields
- Minimum photo requirements:
  - must always maintain **1 main + 3 additional** (4 total)
  - cannot save if photo count falls below required
- Verification integrity:
  - If user changes identity-critical data (legal name, national document, facial validation artifacts):
    - status must revert to `pending_verification` or `unverified` until re-verified
  - If user edits non-identity data (bio), verification should remain (unless policy says otherwise—must be explicit)

## 5) Acceptance criteria (Given/When/Then)
- Given a verified user edits bio only  
  When saved  
  Then they remain verified.

- Given a user tries to remove photos below 4  
  When they attempt to save  
  Then saving is blocked with clear guidance.

## 6) Data & contracts
- Profile edits must create an audit event (for safety/compliance).

## 7) Non-functional requirements
- Save confirmation UI ≤ **1s** on stable network.

## 8) Definition of Done
- UI validation tests for photo minimum.
- Integration tests for verification state changes when identity-critical fields change.
