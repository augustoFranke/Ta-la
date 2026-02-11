# Requirements: v1.1 Party Prep

## Functional Requirements

### REQ-01: Tech Debt Cleanup
Tighten types and clean dead code across hooks, services, and stores. Remove any `any` casts that have proper type alternatives. Ensure TypeScript strict compliance in modified files.

### REQ-02: Party Entry Flow (Deep Linking)
User receives invite link or QR code and lands directly on the party venue screen. Expo Router deep linking with `tala://venue/{id}` scheme. No venue browsing required — party uses invite link.

### REQ-03: Presence Confirmation
In-app notification/prompt to confirm venue presence. When a user is checked in, periodically prompt "Ainda esta aqui?" to maintain check-in validity. Simple modal/alert — not push notification.

### REQ-04: Availability Toggle
Manual "Disponivel" / "Indisponivel" toggle on user's own profile. Controls whether the user can receive drink offers. Stored as `is_available` boolean on the `users` table. Default: available. No auto-reset, no timer — purely manual.

### REQ-05: Realtime Discovery Tuning
Supabase Realtime subscription for venue user roster. Discovery list updates in real-time when users check in/out at the same venue. Target: ~50-100 simultaneous users at a party.

### REQ-06: Fraud Threshold Calibration
Review and adjust trust parameters in `check_in_to_place_v2` RPC for party context. Document current thresholds (distance, freshness, cooldown) and provide guidance for party-specific adjustments.

## Non-Functional Requirements

### REQ-07: All UI Text in pt-BR
All new user-facing text must be in Portuguese (pt-BR).

## Out of Scope

- Swift Live Activities (Apple Developer Program cost)
- Location-based venue browsing fix (party uses invite link)
- Swift rewrite
- friends_only visibility filtering
- In-app chat/messaging
- Push notifications (only in-app prompts)
