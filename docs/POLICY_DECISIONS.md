# Policy Decisions — Tá lá!

> Source of truth: specs in `/specs/**`. Where the constitution (`.specify/memory/constitution.md`) conflicts with a spec, **the spec wins**.
> This document records all explicit policy decisions and TBD resolutions.
> Last updated: 2026-02-20 (Orchestrator Agent, rewrite/integration)

---

## 1. Primary color

| Source | Value |
|--------|-------|
| Constitution v2.0.0 | `#c1ff72` |
| **Spec 010 (authoritative)** | **`#aeee5b`** |

**Decision:** Use `#aeee5b` everywhere. Constitution entry is outdated and must be updated.

---

## 2. In-app chat

| Source | Position |
|--------|----------|
| Constitution v2.0.0 | "No in-app chat in MVP" |
| **Spec 007 (authoritative)** | **Chat IS in MVP** |

**Decision:** Implement full chat (spec 007) including text, emoji, photo upload, and voice messages. Constitution entry is outdated.

---

## 3. Supported Brazilian national document types

Spec 003 mentions "Brazilian national document" without specifying which types.

**Decision:** Accept **CPF** (Cadastro de Pessoas Físicas) as the primary identifier for all users. CPF is mandatory for all Brazilian citizens and is the standard identity anchor. Additionally accept **RG** (Registro Geral) as a supporting document for facial validation purposes. CNH (Carteira Nacional de Habilitação) may be accepted as a secondary document.

Implementation: `document_type` field accepts values: `cpf | rg | cnh`; `cpf` is always required.

---

## 4. Gender/sex allowed values

Spec 003 requires gender/sex field but does not specify allowed values.

**Decision:**
- `sex` field (biological; used for feed filtering per partner preference): `masculino | feminino | outro`
- `gender_identity` field (self-identification; displayed on profile): free text, max 50 chars (optional)
- `partner_preference` field: `homens | mulheres | todos`

Both `sex` and `partner_preference` are required for account creation. `gender_identity` is optional.

These values are considered **sensitive data** under LGPD (spec 011).

---

## 5. Offline chat behavior

Spec 007 says: "define and implement one policy (queue & send later OR fail explicitly)."

**Decision:** **Fail explicitly.** When a message send fails due to connectivity:
- Show "failed" bubble immediately
- Offer manual retry button
- Do NOT silently queue for later (avoids stale-message confusion in an ephemeral venue context)

---

## 6. Chat and media retention

Spec 011 requires defining chat/media retention.

**Decision:**
- Chat messages: retained for **90 days** after the match is active; deleted when match is removed (unmatch or account deletion), whichever comes first.
- Media (photos sent in chat): deleted **7 days** after the match ends or chat is removed.
- Voice messages: treated same as media — 7 days post-match-end.
- After account deletion: all chat messages and media sent by that user are anonymized (sender replaced with "Usuário removido") within **24 hours** of deletion request.

---

## 7. Verification artifact retention

Spec 011 requires defining how long identity verification artifacts (document photos, face captures) are kept.

**Decision:**
- Document photos and face capture images: deleted **immediately after** verification completes (pass or fail), within **1 hour maximum**.
- Verification outcome metadata (pass/fail, timestamp, reason) is retained for **5 years** for audit/safety purposes (no raw images retained).
- If verification is pending: artifacts retained for **72 hours**, then auto-deleted with status reverted to `incomplete`.

---

## 8. Privacy request SLA

Spec 011 sets "within 15 business days."

**Decision:** Operational SLA is **15 business days (dias úteis)**. The in-app privacy center must display this SLA. Automated deletion requests (initiated by user from Settings) are processed **immediately**; human-review requests (data export, correction) follow the 15-day SLA.

---

## 9. Age range default for feed ordering

Spec 006: "±10 years around user age unless user customizes."

**Decision:** Default range is **[user_age - 10, user_age + 10]**, clamped to a minimum of 18. Users may customize via preferences. This filter is a **hard filter** (candidates outside range are excluded entirely, not just downranked).

---

## 10. Re-verification rules (identity-critical field changes)

Spec 009: If user changes identity-critical data → revert to `pending_verification` or `unverified`.

**Decision:**
- Changing `legal_name` or `document_number` (CPF/RG): revert to `pending_verification`; existing verification photos remain on file; user must re-submit verification request.
- Changing main photo (first slot): revert to `pending_verification` if face validation was tied to that photo.
- Changing non-identity fields (bio, interests, partner preference, non-main photos): verification status **unchanged**.
- If user has never been verified and edits: no status change needed.

---

## 11. Rate limits (definitive values)

| Action | Limit | Window |
|--------|-------|--------|
| Login attempts | 5 | 10 minutes per email + IP |
| Email verification resend | 3 | 1 hour |
| OTP resend (phone) | 3 | 30 minutes |
| OTP wrong attempts | 5 | → 30-minute lockout |
| Face validation attempts | 3 | per day |
| Check-in/out events | 5 | 10 minutes |
| Likes | 30 | 1 hour |
| Drink offers | 10 | 1 hour |

---

## 12. Auto-checkout thresholds

Spec 005: "no valid location for 30 min, OR outside radius for 10 min continuously."

**Decision:** Both triggers apply independently:
- **Stale location:** No GPS update received for **30 minutes** → auto-checkout (reason: `stale_location`)
- **Out of range:** User continuously outside 100m radius for **10 minutes** → auto-checkout (reason: `out_of_range`)
- **App kill / sign-out:** Immediate checkout (reason: `app_killed` / `signout`)

---

## 13. DEV bypass build isolation

Spec 013: "must not write to real production data by default."

**Decision:** DEV bypass builds connect to the **local Supabase development instance** (`.env.development` / `EXPO_PUBLIC_SUPABASE_URL` pointing to `http://127.0.0.1:54321`). Production builds use `.env.production`. The build profile (`eas.json` or `app.config.js`) determines which env file is loaded. A CI check asserts `IS_DEV_BYPASS=false` in production profiles.

---

## 14. Abuse prevention — unmatch anti-harassment loop

Spec 007: "users should not reappear to each other in the same venue feed session."

**Decision:** After unmatch/remove, both users are added to each other's **session-scoped exclusion list** (stored in memory/AsyncStorage for the current check-in session). The exclusion list is cleared on checkout. Permanently blocked users (via explicit block) are excluded across all sessions.

---

## 15. Photo minimum enforcement

Spec 009 & 003: "must always maintain 1 main + 3 additional (4 total)."

**Decision:** The "main photo" occupies slot 0; slots 1–3 are the three additional photos. All 4 slots are mandatory. The UI must prevent saving with fewer than 4 photos. The main photo (slot 0) is the one used for face validation.

---

*Decisions marked TBD that are NOT in this document should be added here before implementation begins. Lower-tier agents (Sonnet/Haiku) encountering policy ambiguity must write a question here and stop.*
