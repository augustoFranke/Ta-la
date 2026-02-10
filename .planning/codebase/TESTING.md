# Testing Patterns

**Analysis Date:** 2026-02-10

## Test Framework

**Runner:**
- Not detected in repository scripts/config.
- Config: Not detected (`jest.config.*` missing, `vitest.config.*` missing, no test config under project root).

**Assertion Library:**
- Not detected.

**Run Commands:**
```bash
Not applicable - no test command in `package.json`
Not applicable - watch mode not configured
Not applicable - coverage command not configured
```

## Test File Organization

**Location:**
- Not detected; no `*.test.*`, `*.spec.*`, or `__tests__/` files found in `app/` or `src/`.

**Naming:**
- Not detected.

**Structure:**
```
Not detected in current codebase.
```

## Test Structure

**Suite Organization:**
```typescript
// Not detected: no describe/test suites in `app/` or `src/`.
```

**Patterns:**
- Setup pattern: Not detected.
- Teardown pattern: Not detected.
- Assertion pattern: Not detected.

## Mocking

**Framework:** Not detected

**Patterns:**
```typescript
// Not detected: no jest/vitest/mock usage in application test files.
```

**What to Mock:**
- Not applicable in current repository state.

**What NOT to Mock:**
- Not applicable in current repository state.

## Fixtures and Factories

**Test Data:**
```typescript
// Not detected: no fixtures/factories in `app/` or `src/`.
```

**Location:**
- Not detected.

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
Not applicable - no coverage tooling configured
```

## Test Types

**Unit Tests:**
- Not detected for hooks/services/components in `src/hooks/`, `src/services/`, or `src/components/`.

**Integration Tests:**
- Not detected for Supabase flows in `src/hooks/useAuth.ts`, `src/hooks/useCheckIn.ts`, `src/hooks/useProfile.ts`, or `src/services/places.ts`.

**E2E Tests:**
- Not used (no Detox, Playwright, or Cypress config/scripts detected in project root `package.json`).

## Common Patterns

**Async Testing:**
```typescript
// Not detected in test files.
// Current async production pattern (reference only) uses try/catch/finally:
// `src/hooks/useAuth.ts` and `src/hooks/useProfile.ts`
```

**Error Testing:**
```typescript
// Not detected in test files.
// Current production error contract (reference only):
// functions return `{ success: false, error: string }` in `src/hooks/useAuth.ts`
// and `src/hooks/useCheckIn.ts`.
```

---

*Testing analysis: 2026-02-10*
