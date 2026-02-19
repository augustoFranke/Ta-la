# Ta la! (Expo + Supabase)

## Current stack

- Expo SDK 54
- React Native 0.81
- Expo Router (file-based routing in `app/`)
- Zustand
- Supabase
- TypeScript

## Prerequisites

- Node.js 20+
- npm 10+
- Expo Go (iOS/Android) to run on a physical device

## Quality and run commands

- `npm test`: runs all required checks at the current project level (`lint` + `typecheck`)
- `npm run test:project`: same flow as `npm test`
- `npm run lint`: project linting via Expo
- `npm run typecheck`: TypeScript type validation (`tsc --noEmit`)
- `npm start`: starts the local Expo dev server
- `npm run web`: starts the web preview
