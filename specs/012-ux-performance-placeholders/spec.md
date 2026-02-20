# Tá lá! — Spec 012: UX, performance targets, animations & missing API keys placeholders

## 1) Problem statement (why)
The app must feel modern, fast, and robust even when integrations aren’t configured in v1.

## 2) Scope
**In scope**
- Animation requirements
- Responsiveness requirements
- Performance thresholds
- Missing API key placeholder behavior

## 3) Users & workflows
- User navigates quickly; UI responds instantly; network operations show safe pending states.

## 4) Functional requirements
- Animations must exist for:
  - screen transitions
  - feed swipe/drag
  - button press feedback
- UI must remain interactive during network operations (use local pending states).
- If any required API key is missing (v1):
  - render a placeholder component
  - placeholder must describe what should appear there
  - app must not crash and must not block unrelated flows

## 5) Acceptance criteria (Given/When/Then)
- Given an integration key is missing  
  When user opens the affected screen  
  Then they see a placeholder explaining the missing integration, and other areas still work.

## 6) Data & contracts
- Placeholder messaging must not leak secrets or internal config paths.

## 7) Non-functional requirements (hard targets)
- Input → visible feedback ≤ **100ms**.
- Screen transition perceived ≤ **400ms**.
- Scrolling lists maintain **60fps** on mid-tier devices in typical conditions.
- Crash-free sessions ≥ **99.5%** during beta.

## 8) Definition of Done
- Performance evidence meets thresholds (automated and/or reproducible manual).
- Placeholder behavior covered in tests.
