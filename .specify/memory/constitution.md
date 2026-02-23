# Constitution (Non-Negotiable)

## Project

- **App:** Tá lá! — social mobile app (React Native + Expo + Supabase)
- **Region:** Dourados, MS, Brazil
- **Stage:** MVP

## Directory structure

```
app/           # Expo Router pages (file-based routing)
  (auth)/      # Authentication screens
  (tabs)/      # Tab navigation screens
src/
  components/  # Reusable UI components
    ui/        # Base UI components (Button, Input, Card, etc.)
  hooks/       # Custom React hooks
  services/    # API and external service integrations
  stores/      # Zustand state stores
  theme/       # Design tokens and styling
  types/       # TypeScript type definitions
```

## UI / Visual design

- No emojis in UI or code — use icon libraries (`expo-vector-icons` or project icon components)
- Prefer components from `src/components/ui/` when possible
- Primary color: `#aeee5b`

## Localization

- All user-facing text in **Portuguese (pt-BR)**: labels, buttons, placeholders, errors, notifications, navigation, empty states
- Code comments and variable/function names may stay in English

## Forms & state

| Tool | When to use |
|------|-------------|
| `useState` | Small/simple forms, few fields, minimal validation, no dynamic logic |
| `useReducer` | Medium/large forms with state updates dependent on previous state or multi-step conditional flows |
| `react-hook-form` | Large forms where performance and real-time/async validation matter |

## MVP scope guardrails

- Core features: drink offers, check-in, discovery of users at the same venue
- Check-in must validate proximity (50–100 m) and confirm venue presence
- In-app chat/messaging IS in MVP scope (text, emoji, photo, voice) per Spec 007
- Venue vibes and dating score are out of scope

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `feat`, `fix`, `chore`, `docs`, `test`, `refactor`

## Workflow

- Always create a new git worktree and a new branch for every new feature

---

## Quality gates (must pass before PR is considered done)
- Tests: `npm test`
- Lint/typecheck: `npm run lint && npm run typecheck`
- Format: `npm run lint -- --fix && npm run lint`

### Required commands
- Install deps: `npm install`
- Local run: `npm start`
- Web run (optional smoke): `npm run web`
- PR verification (minimum): `npm test`

### Minimum test expectations
- Any behavior change MUST include:
  1) spec update (`specs/`), and
  2) tests proportional to risk.
- Every bug fix MUST include a regression test.
- If automated coverage is temporarily not feasible, PR is blocked unless:
  1) explicit exception is documented in the spec,
  2) manual verification checklist is added, and
  3) follow-up test task is created and linked.
- Flaky/disabled tests are forbidden.

### Formatting and lint rules
- ESLint is the canonical formatting/lint gate in this repo.
- No lint errors or typecheck errors are allowed in merged code.
- Use project tokens/components (`src/theme`, `src/components/ui`) for UI consistency.
- All user-facing text must remain in pt-BR.

## Architecture constraints
- Expo Router only (`app/` file-based routing); do not migrate to React Navigation.
- State management must remain in Zustand (`src/stores`).
- HTTP client must be native `fetch` only.
- Location must use `expo-location`.
- Supabase is the source of truth for auth, persistence, RPC, and realtime.

### Layering rules
- Route/screens (`app/`) should orchestrate UI and hooks, not embed complex business rules.
- Business logic belongs in hooks/services (`src/hooks`, `src/services`).
- Data access goes through service modules; direct backend calls in UI are legacy exceptions and must not be expanded.
- Shared domain/database types must live in `src/types`.
- Theme tokens/styles must come from `src/theme`.

### Forbidden dependencies
- `axios` (or equivalent alternative HTTP clients).
- React Navigation migration dependencies for routing.
- React Native geolocation replacements for app location flow.
- New global state libraries without ADR approval.

### Module boundaries
- `src/services/*`: API/RPC/data access contracts only.
- `src/hooks/*`: orchestration and side effects.
- `src/stores/*`: shared state and minimal state transitions.
- `src/components/*`: presentational and interaction UI.
- `app/*`: route composition and screen-level wiring.

## Coding standards

### Error handling style
- Never swallow errors silently.
- Service layer should throw or return typed/domain-safe errors.
- UI layer must convert failures into clear user-facing pt-BR messages.
- Avoid broad catch blocks without contextual logging.

### Logging and observability expectations
- Use structured, contextual error logs (`console.error`) at failure boundaries.
- Include operation context (module/action) in logs.
- Avoid noisy `console.log` in production code paths.
- Realtime and network failure paths must be observable via logs.

### Naming conventions
- Components/types/interfaces: PascalCase.
- Hooks/services/stores/functions/variables: camelCase.
- Constants: UPPER_SNAKE_CASE.
- Route files follow Expo Router conventions under `app/`.
- Shared types must be centralized in `src/types`.

## Dependency policy
- No new dependencies without:
  1) updating `docs/ARCHITECTURE.md`
  2) adding rationale in `docs/DECISIONS/<adr>.md`

## Change policy
- No new deps without updating docs.
- Behavior changes require spec + tests.
- Backward compatibility rules:
  - Do not break existing app flows, route contracts, or persisted data contracts without a migration plan.
  - For breaking DB/RPC changes, provide compatibility strategy (versioned RPC, migration path, or coordinated rollout).
  - Public/shared types should be evolved compatibly where possible; breaking changes must be explicitly documented.

## Agent workflow rules
- Always produce a plan before writing code.
- Always list assumptions and unknowns explicitly.
- Always run verification commands and report results.
- Keep changes small and reviewable.
- Update specs/tests when behavior changes.

## Governance
- This constitution supersedes local implementation preferences.
- Any amendment must include motivation, impact, and migration guidance.
- Versioning follows SemVer:
  - MAJOR: incompatible policy change
  - MINOR: new rule/section
  - PATCH: clarification only

**Version**: 2.0.0  
**Last Amended**: 2026-02-19
