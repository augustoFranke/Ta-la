# Tá lá!

Social mobile app for Dourados, MS, Brazil. Built with Expo + Supabase.

## Stack

- Expo SDK 54 + React Native 0.81
- Expo Router (file-based routing)
- Zustand
- Supabase (Auth + Postgres + RPC + Realtime + Storage)
- TypeScript

## Prerequisites

- Node.js 20+
- npm 10+
- Expo Go (iOS/Android) to run on a physical device

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=
EXPO_PUBLIC_DEV_SKIP_AUTH=       # optional, dev only
```

## Commands

| Command | What it does |
|---------|--------------|
| `npm start` | Start Expo dev server (Expo Go / EAS Preview) |
| `npm run web` | Start web preview |
| `npm run android` | Run Android native target |
| `npm run ios` | Run iOS native target |
| `npm run lint` | ESLint via Expo |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm test` | Lint + typecheck (required before PR) |

## Docs

| File | Contents |
|------|----------|
| `docs/REPO_MAP.md` | Full repository map, routes, hooks, services, stores, migrations |
| `docs/ARCHITECTURE.md` | Current architecture, layering rules, data flow |
| `docs/DECISIONS/` | Architecture Decision Records (why choices were made) |
| `.specify/memory/constitution.md` | Project rules, constraints, and coding standards |
| `specs/` | Feature specifications and contracts |
