# Roadmap: Ta la

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-02-10)
- ◆ **v1.1 Party Prep** — Phases 5-7

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-02-10</summary>

- [x] Phase 1: Check-in Trust Core (2/2 plans) — completed 2026-02-10
- [x] Phase 2: Same-Venue Discovery (2/2 plans) — completed 2026-02-10
- [x] Phase 3: Safety and Moderation Enforcement (2/2 plans) — completed 2026-02-10
- [x] Phase 4: Offer and Notification Controls (2/2 plans) — completed 2026-02-10

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### Phase 5: Tech Debt and Party Foundation

**Goal:** Clean up dead code causing LSP errors, add `is_available` column to users table, and implement deep linking so invite links route directly to venue screens.

**Requirements:** REQ-01, REQ-02, REQ-04 (DB only)

**Plans:** 1 plan

Plans:
- [x] 05-01-PLAN.md — Dead file cleanup, is_available type, deep linking — completed 2026-02-11

### Phase 6: Party Experience

**Goal:** Working party flow — availability toggle UI on profile, presence confirmation prompts, and realtime discovery updates for venue roster at party scale.

**Requirements:** REQ-03, REQ-04 (UI), REQ-05

**Plans:** 3 plans

Plans:
- [ ] 06-01-PLAN.md — SQL migrations (is_available, realtime publication) + availability toggle UI
- [ ] 06-02-PLAN.md — Presence confirmation hook/modal + checkout function
- [ ] 06-03-PLAN.md — Realtime venue subscription + discover screen integration

### Phase 7: Trust Calibration

**Goal:** Review and document fraud threshold parameters for party context. Adjust check-in distance, freshness, and cooldown values for controlled party events.

**Requirements:** REQ-06

**Plans:** [To be planned]

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Check-in Trust Core | v1.0 | 2/2 | Complete | 2026-02-10 |
| 2. Same-Venue Discovery | v1.0 | 2/2 | Complete | 2026-02-10 |
| 3. Safety and Moderation Enforcement | v1.0 | 2/2 | Complete | 2026-02-10 |
| 4. Offer and Notification Controls | v1.0 | 2/2 | Complete | 2026-02-10 |
| 5. Tech Debt and Party Foundation | v1.1 | 1/1 | Complete | 2026-02-11 |
| 6. Party Experience | v1.1 | 0/3 | Pending | — |
| 7. Trust Calibration | v1.1 | 0/? | Pending | — |
