# Feature Research

**Domain:** Location-social mobile app for venue check-ins and same-venue discovery
**Researched:** 2026-02-10
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Reliable proximity check-in (GPS + radius + anti-abuse rules) | Location-social trust fails if users can check in from anywhere; Swarm explicitly gates rewards by distance and rapid-fire limits | MEDIUM | Keep 50-100m proximity validation, add velocity/time plausibility checks, and a short cooldown for repeated distant check-ins |
| Presence visibility controls per check-in | Users now expect control over who sees location; Snap Map and Swarm both expose audience/privacy toggles | MEDIUM | Add per-check-in modes: Public at venue, Friends-only, Off-grid (private history only) |
| Here-now list with freshness window | Core social payoff is "who is here now", but stale presence breaks trust | MEDIUM | Show only recent active check-ins (for example <=3h), auto-expire visibility, and show last-seen recency |
| Block/report safety controls in discovery surfaces | Stranger discovery without reporting/blocking is unacceptable in 2026 social products | LOW | One-tap block/report from profile and venue roster; reason codes: spam, harassment, fake check-in, bad venue data |
| Venue detail quality baseline | Users expect useful place data (name, distance, hours, tips/photos) before deciding where to go | MEDIUM | Start with canonical fields + community correction flow for wrong pins/categories |
| Notification controls for social/location events | People expect alerts, but also expect fine-grained controls | MEDIUM | Separate toggles: friends checked in nearby, check-in reminders, offer alerts; opt-in by type |
| Clear account/profile trust signals | Users need quick confidence cues before meeting nearby people | MEDIUM | Display profile completeness, account age bucket, and optional verified-phone badge |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Offer-linked check-in unlocks | Directly ties Ta la core value (drink offers) to verified in-venue presence | HIGH | Unlock venue offers only after validated check-in; expires quickly to prevent screenshot abuse |
| Local crowd pulse for Dourados venues | Gives immediate "worth going now?" answer that generic map apps do not optimize for | MEDIUM | Build anonymized live pulse from active check-ins by time slot and day |
| Trust-first discovery ranking | Better matches in same venue by balancing proximity, recency, and behavior quality | HIGH | Rank discovery by recent valid check-ins, mutual signals, and low abuse risk; down-rank suspicious patterns |
| Low-friction meetup intents (no chat) | Enables real-world connection while respecting no-chat MVP guardrail | MEDIUM | Add structured intents like "disponivel para brindes" / "grupo aberto" with expiry and one-tap revoke |
| Venue memory timeline (private-first) | Creates retention loop from personal venue history, not only live interactions | MEDIUM | Private timeline first, optional selective sharing later; improves return visits and habit formation |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-app 1:1 or group chat | "Users need to talk before meeting" | Moderation and abuse surface explodes; slows MVP; directly conflicts with current scope guardrails | Use structured meetup intents, profile prompts, and in-person discovery only |
| Always-on background live tracking by default | "More real-time data" | High privacy risk, battery cost, and user distrust in small-city context | Keep explicit check-ins + optional temporary live presence window |
| Public global map of all users | "Feels viral" | Doxxing/stalking risk and safety concerns, especially in smaller regions | Restrict visibility to contextual venue rosters + friend/audience controls |
| Heavy gamification economy (coins, streak pressure, mayorship wars) as core | "Boost engagement quickly" | Encourages fake/drive-by check-ins and trust erosion | Use lightweight rewards tied to authentic local participation and offer redemption quality |
| Anonymous mode in same-venue discovery | "Lower social friction" | Drives harassment and low-accountability behavior | Keep pseudonymity optional, but require accountable profile and enforce block/report tools |

## Feature Dependencies

```
Verified proximity check-in
    └──requires──> Accurate location permissions + device health checks
                         └──requires──> User education and permission fallback UX

Here-now roster
    └──requires──> Presence visibility controls
                         └──requires──> Privacy defaults + per-check-in audience selector

Offer-linked unlocks
    └──requires──> Verified proximity check-in
                         └──requires──> Anti-abuse rules (cooldown, impossible travel detection)

Trust-first discovery ranking
    └──requires──> Event logging + trust signals
                         └──requires──> Moderation actions (block/report outcomes)

Low-friction meetup intents ──enhances──> Here-now roster

Public global map ──conflicts──> Safety-first local discovery model
Always-on background tracking ──conflicts──> Privacy-first check-in model
In-app chat ──conflicts──> Current MVP scope
```

### Dependency Notes

- **Verified proximity check-in requires permission fallback UX:** without recovery flows, users deny permission and churn before first successful check-in.
- **Here-now roster requires privacy controls:** roster quality depends on users feeling safe enough to stay visible.
- **Offer-linked unlocks require anti-abuse rules:** otherwise offer economics are gamed by spoofed or remote check-ins.
- **Trust-first ranking requires moderation outcomes:** ranking quality improves only when abuse signals feed back into scoring.
- **Public global map conflicts with safety-first discovery:** Ta la should optimize trusted local presence, not maximum exposure.

## MVP Definition

### Launch With (v1)

Minimum viable product - what is needed to validate the concept.

- [ ] Reliable proximity check-in with anti-abuse limits - foundational trust for every other feature.
- [ ] Here-now roster with per-check-in visibility controls - core social value with safety.
- [ ] Block/report from roster and profile - minimum protection for same-venue discovery.
- [ ] Offer-linked check-in unlock (basic) - validates Ta la's monetizable wedge in venues.
- [ ] Notification preferences (social vs offer alerts) - prevents fatigue and churn.

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Trust-first discovery ranking - add once enough event data exists to train robust heuristics.
- [ ] Local crowd pulse by venue/time - add when active check-in volume supports reliable signal.
- [ ] Venue memory timeline (private-first) - add when retention needs strengthen post-launch.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Advanced social layers (friend circles, recurring crews) - defer until baseline safety/moderation operations are stable.
- [ ] Broader city expansion mechanics - defer until Dourados unit economics and abuse controls are proven.
- [ ] Rich gamification systems - defer unless trust metrics stay strong under increased incentive pressure.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Reliable proximity check-in + anti-abuse | HIGH | MEDIUM | P1 |
| Here-now roster + privacy controls | HIGH | MEDIUM | P1 |
| Block/report safety controls | HIGH | LOW | P1 |
| Offer-linked check-in unlock | HIGH | HIGH | P1 |
| Notification preference center | MEDIUM | MEDIUM | P1 |
| Trust-first discovery ranking | HIGH | HIGH | P2 |
| Local crowd pulse | MEDIUM | MEDIUM | P2 |
| Venue memory timeline | MEDIUM | MEDIUM | P2 |
| Rich gamification economy | LOW | HIGH | P3 |
| In-app chat | MEDIUM | HIGH | P3 (anti-feature for now) |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A (Swarm) | Competitor B (Snap Map) | Our Approach |
|---------|----------------------|--------------------------|--------------|
| Check-in mechanics | Explicit venue check-ins, editing, off-grid mode, check-in reminders | Passive location sharing map-first | Keep explicit venue check-ins (trust) plus lightweight reminders |
| Presence privacy | Public vs private check-ins, map visibility settings | Sharing off by default, friend-scope controls, Ghost Mode | Privacy by default with per-check-in audience and fast hide toggle |
| Same-place discovery | "Here now" people list tied to recent public check-ins | Friend location visibility on map | Venue roster with recency window + stronger trust filters |
| Abuse handling | Rapid-fire checks, anti-cheat outcomes, report/block | Strong privacy controls, selective sharing | Combine anti-spoof checks + block/report + conservative defaults |
| Core engagement loop | Lifelog + gamification | Social map awareness | Venue offers + trustworthy same-venue discovery in pt-BR local context |

## Sources

- Swarm homepage/about (official): https://www.swarmapp.com/ and https://swarmapp.com/about/ (MEDIUM confidence)
- Foursquare Swarm support: check-ins, map, notifications, reporting, check-in issues, visibility (official docs, 2025 updates):
  - https://support.foursquare.com/hc/en-us/articles/21181809706012-Swarm-check-ins
  - https://support.foursquare.com/hc/en-us/articles/21311494176156-Navigating-Swarm-s-Map
  - https://support.foursquare.com/hc/en-us/articles/21182608147868-Notifications-Getting-Notified-With-Foursquare-Swarm
  - https://support.foursquare.com/hc/en-us/articles/14884529753884-Reporting-a-User
  - https://support.foursquare.com/hc/en-us/articles/14884420779804-Checkin-Issues
  - https://support.foursquare.com/hc/en-us/articles/14883960538396-Can-Others-See-Me-When-I-Check-in
  (HIGH confidence for feature behavior claims)
- Snapchat support: location sharing defaults, privacy controls, Ghost Mode, location expiry:
  - https://help.snapchat.com/hc/articles/7012309470740
  - https://help.snapchat.com/hc/articles/7012343074580
  - https://help.snapchat.com/hc/articles/7012322854932
  - https://help.snapchat.com/hc/articles/7012280385684
  (MEDIUM confidence for cross-product expectation signals)
- Google help: location sharing settings and location accuracy caveats:
  - https://support.google.com/accounts/answer/9363497
  - https://support.google.com/maps/answer/2839911
  (MEDIUM confidence for trust/privacy baseline expectations)

---
*Feature research for: Ta la location-social check-in/discovery milestone*
*Researched: 2026-02-10*
