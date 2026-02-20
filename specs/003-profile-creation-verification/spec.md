# Tá lá! — Spec 003: Profile creation & verification (Brazil)

## 1) Problem statement (why)
To improve safety and reduce phishing/impersonation, users must provide a complete identity-backed profile and pass verification before check-in.

## 2) Scope
**In scope**
- Required profile fields and validations
- Phone verification (OTP)
- Brazilian document submission
- 4 photos total (1 main + 3 anti-phishing)
- Facial identity validation for verified badge
- Verification gating for check-in

**Out of scope**
- Non-Brazil identity documents
- Manual moderator workflows (v1)

## 3) Users & workflows
**Happy path**
1. User has a confirmed email account.
2. Completes profile wizard with all required fields.
3. Verifies phone via OTP.
4. Uploads photos.
5. Submits national document.
6. Completes face validation.
7. Status becomes Verified; badge appears.
8. User can check in.

## 4) Functional requirements
### Required profile fields (MUST)
User **MUST** provide:
- phone number + successful verification
- main profile photo
- full legal name
- Brazilian national document (supported types must be explicitly defined in-app)
- 3 additional photos (“anti-phishing photos”)
- bio/description
- age (must be ≥ **18**)
- gender and sex (allowed options must be explicitly defined)
- partner preference: preferred sex for partners (allowed options must be explicitly defined)

### Validation rules (MUST)
- **Age**
  - user must be ≥ 18
  - if underage, block service use and prevent check-in permanently
- **Phone OTP**
  - OTP expires after **10 minutes**
  - max attempts: **5**
  - lockout after max attempts: **30 minutes**
- **Photos**
  - all 4 photo slots are required
  - photos must pass a quality check (reject blank/too dark/extremely blurry)
  - reject duplicate identical images across slots
- **National document**
  - must pass format validation for supported document type(s)
  - invalid format → block submission with field-level error
- **Face validation**
  - required for verified badge
  - if fail: user remains unverified and cannot check in
  - retry limit: **3 attempts/day**, then “Try again tomorrow”

### Verification status model (MUST)
Profile **MUST** support:
- `incomplete`
- `pending_verification`
- `verified`
- `rejected` with reason categories:
  - `photo_quality`
  - `document_invalid`
  - `face_mismatch`
  - `other` (with safe, user-friendly copy)

### Check-in gating (MUST)
- If profile is not `verified`:
  - Home CTA **MUST** show **“Verify your profile to check in”** (not “Check in”)
  - Any check-in attempt routes into verification wizard

## 5) Acceptance criteria (Given/When/Then)
- Given email is confirmed but profile is incomplete/unverified  
  When user views a venue eligible for check-in by distance  
  Then CTA shows “Verify your profile to check in”.

- Given user completes all fields and passes phone/document/face validation  
  When verification completes  
  Then status becomes `verified` and badge is displayed.

### Edge/fail cases
- OTP expired → allow resend with throttling.
- Document invalid format → block with precise error.
- Duplicate photos → block until unique.
- Underage input → immediate block with explanation.
- Face validation fails → remain unverified; show retry guidance.

## 6) Data & contracts
- Profile must store:
  - verification status + timestamps
  - attempt counters for OTP and face validation
  - structured rejection reasons
- Verification artifacts retention must follow privacy requirements (see LGPD spec).

## 7) Non-functional requirements
- Profile wizard must support pause/resume without losing progress.
- All rejection messaging must be clear Portuguese (Brazil) and avoid disclosing bypass hints.

## 8) Definition of Done
- Unit tests: age + OTP rules + doc format checks.
- Integration tests: status transitions.
- E2E: wizard success → verified; fail paths → blocked.
- UX copy approved for rejection reasons.
