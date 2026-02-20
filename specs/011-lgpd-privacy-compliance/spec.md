# Tá lá! — Spec 011: LGPD & privacy compliance (Brazil)

## 1) Problem statement (why)
Tá lá! processes sensitive data (ID docs, biometrics, partner preference). Compliance with Brazil’s LGPD is essential for legality and trust.

## 2) Scope
**In scope**
- Transparency (what is collected and why)
- Data minimization + retention requirements
- User rights flows (access, correction, deletion, etc.)
- Security and incident-response requirements (product-level)

## 3) Users & workflows
- User requests a copy of their data.
- User requests correction.
- User requests deletion.
- User revokes consent (where applicable).

## 4) Functional requirements (product-facing)
- The app must clearly disclose:
  - what data is collected
  - why it is collected (purpose limitation)
  - what is required vs optional
- The app must provide user-accessible mechanisms to exercise LGPD rights, including:
  - access/confirmation of processing
  - correction
  - deletion
  - portability (when applicable by policy)
  - information about sharing
  - consent revocation (where consent is the legal basis)
- Sensitive data handling must be explicitly covered in the privacy experience:
  - biometric data, national document data, and partner preference data treated as sensitive.

### Data retention (MUST)
- Define retention windows for:
  - verification raw artifacts (document photos, face captures): keep only as long as necessary to verify, then delete or irreversibly transform
  - chat/media: define retention and deletion behavior
- Account deletion must remove/anonymize data per the defined policy.

### Security (MUST)
- Implement appropriate safeguards to prevent unauthorized access and incidents.
- Maintain an audit trail for:
  - verification attempts
  - privacy requests
  - deletion actions

## 5) Acceptance criteria (Given/When/Then)
- Given a user requests data export  
  When fulfilled  
  Then they receive a complete dataset as defined in the privacy policy.

- Given a user requests deletion  
  When completed  
  Then the user is removed from feeds, chats, matches, and notifications surfaces, and cannot be discovered/messaged.

## 6) Data & contracts
- Privacy request records must include:
  - request type
  - timestamp
  - resolution outcome
  - proof of completion (system-side)

## 7) Non-functional requirements
- Privacy request response SLA must be defined (e.g., within **15 business days**) and enforced operationally.
- Maintain auditability without exposing sensitive data in logs.

## 8) Definition of Done
- Privacy surfaces exist in Settings and match actual behavior.
- Automated tests verify deletion removes user from key features and revokes access.
