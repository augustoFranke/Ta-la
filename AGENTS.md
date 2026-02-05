# Project Instructions

## Project Overview
- Tá lá! is a social mobile app built with React Native (Expo) and Supabase.
- Target region: Dourados, MS, Brazil.

## Directory Structure
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

## Tech Stack & Environment
- Framework: Expo SDK 54 + React Native 0.81
- Routing: Expo Router (file-based) under `app/` (do not migrate to React Navigation)
- State: Zustand
- Database: Supabase
- Auth: Supabase Auth (email OTP)
- HTTP: `fetch` only (do not add Axios)
- Location: `expo-location` (do not replace with RN Geolocation)
- Realtime: Supabase Realtime for offers/check-ins
- Language: TypeScript
- Build: Expo Go / EAS Preview only (no development builds)

## UI/Visual Design
- No emojis in UI or code for visual representation
- Use icon libraries (`expo-vector-icons` or project icon components) and keep styling consistent
- Prefer UI components from `src/components/ui/` when possible
- Primary color: `#c1ff72`

## Localization
- All user-facing text must be in Portuguese (pt-BR), including labels, buttons, placeholders, errors, notifications, navigation, empty states
- Code comments and variable/function names may remain in English

## Forms & State
- `useState`: small/simple forms, few fields, minimal validation, no dynamic logic
- `useReducer`: medium/large forms with state updates dependent on previous state or multi-step conditional flows
- `react-hook-form`: large forms where performance and real-time/async validation matter

## MVP Scope Guardrails
- Core MVP features: drink offers, check-in, and discovery of users at the same venue
- Check-in must validate proximity (50-100m) and confirm venue presence
- No in-app chat/messaging in MVP
- Venue vibes/dating score are out of scope for now

## Commands
- `npm start` — Expo dev server (Expo Go / Preview)
- `npm run web` — Web preview

## Commits
- Use Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`)

## Workflow
- Always create a new git worktree and a new branch for every new feature.
