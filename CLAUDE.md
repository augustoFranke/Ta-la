# Project Context Index

Read these first:

1. `docs/REPO_MAP.md` — where things are + how to run
2. `docs/ARCHITECTURE.md` — current architecture and constraints
3. `docs/DECISIONS/` — ADRs (why choices were made)
4. `specs/` — feature specs + contracts
5. `.specify/memory/constitution.md` — project rules, constraints, and coding standards

## Dev mode rules

- All client-side rate limits and abuse prevention throttles MUST be bypassed when `__DEV__` is true. Guard every throttle check with `if (!__DEV__)`. See `docs/POLICY_DECISIONS.md` §16 for full rationale.
