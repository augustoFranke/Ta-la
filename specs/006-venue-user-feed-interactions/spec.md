# Tá lá! — Spec 006: Venue feed ordering + interactions (Like / Offer a drink)

## 1) Problem statement (why)
After check-in, users should see relevant profiles first, interact safely, and receive clear outcomes (match, accept/reject).

## 2) Scope
**In scope**
- Venue feed UI with swipe/drag next user
- 3-photo carousel per profile card
- “Offer a drink” and “Like” actions
- Ordering by preference & match likelihood (rules-based)
- Outcomes: mutual like; offer accepted/rejected

**Out of scope**
- Paid boosts/superlikes (v1).

## 3) Users & workflows
**Happy path**
1. Checked-in user sees first candidate.
2. Swipes photos / reads bio.
3. Presses Like or Offer a drink.
4. Candidate is notified.
5. Mutual like or offer accepted → match created.

## 4) Functional requirements
### Access & visibility (MUST)
- Only checked-in users can access venue feed.
- Feed shows only users currently checked-in at the same venue.
- Users must not see profiles they have blocked/removed.

### Profile card content (MUST)
Each card must show:
- name
- bio/description
- carousel of exactly **3** photos
- actions:
  - primary: “Offer a drink” (glass icon, wide)
  - secondary: “Like” (heart outline, narrower)

### Ordering algorithm (explicit & testable)
Feed ordering must be based on a **compatibility score**:

**Hard filters (must pass)**
- Candidate age within user acceptable range (define default policy: **±10 years** around user age unless user customizes)
- Candidate sex matches user’s partner preference

**Soft scoring**
- Textual similarity between bios (shared keywords/interests)
- Recently active preferred (if available)

**Tie-breakers**
- Stable shuffle per session (seeded) to avoid identical ordering every refresh.

**Constraints**
- The algorithm must not infer sensitive traits beyond user-provided fields.
- No hidden “attractiveness” ranking; only explicit compatibility factors.

### Interaction outcomes (MUST)
**Like**
- If other user has already liked you → create match
- Else store pending like (recipient sees “like received” notification)

**Offer a drink**
- Sends request to recipient
- Recipient can accept or reject
- Accept → match + chat enabled
- Reject → sender notified; no chat created

### Rate limits / abuse controls (MUST)
- Likes: max **30 per hour**
- Offers: max **10 per hour**
- Throttling must be user-friendly and not disclose bypass details.

## 5) Acceptance criteria (Given/When/Then)
- Given two users with mutual like  
  When the second like is sent  
  Then a match is created and both users are notified.

- Given an offer is sent  
  When recipient accepts  
  Then match is created and chat becomes available.

- Given recipient rejects  
  When rejected  
  Then sender is notified of rejection and no chat is created.

### Edge/fail cases
- Candidate checks out while visible:
  - any interaction returns “This user is no longer at the venue.”
- Network failure during interaction:
  - show retry; must not double-submit (idempotent actions)
- Rapid tapping/spam:
  - enforce limits and cooldown.

## 6) Data & contracts
Store events:
- like sent/received
- offer sent/accepted/rejected
- match created
Feed session should be debuggable:
- store shuffle seed or session id.

## 7) Non-functional requirements
- Swipe/drag interactions remain fluid (target 60fps).
- Tap → visible feedback ≤ **100ms**.
- No duplicate interactions due to retries.

## 8) Definition of Done
- Unit tests for compatibility rules and ordering determinism.
- Integration tests: match creation, offer flow accept/reject.
- E2E: like→match, offer→accept/reject, rate-limit enforcement.
